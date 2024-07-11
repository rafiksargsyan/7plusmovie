import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ReleaseRead } from '../domain/entity/Release';
import { AudioLang } from '../domain/AudioLang';
import { Nullable } from '../../utils';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const cfDistroRandomSelectionProportion = Number.parseFloat(process.env.CF_DISTRO_RANDOM_SELECTION_PROPORTION!);
const cfDistroUsageThreshold = Number.parseFloat(process.env.CF_DISTRO_USAGE_THRESHOLD!);
const cloudflareMediaAssetsDomain = process.env.CLOUDFLARE_MEDIA_ASSETS_DOMAIN!;

const terabiteInBytes = 1_000_000_000_000; // Max free outgoing traffic for Cloudfront is 1TB

const docClient = DynamoDBDocument.from(new DynamoDB({}));  

interface GetMovieParam {
  movieId: string;
}

interface GetMovieMetadataResponse {
  subtitles: { [key: string]: string };
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: Nullable<string>;
  backdropImage: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
}

interface Movie {
  id: string
  subtitles: { [key: string]: { relativePath : string } };
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: Nullable<string>;
  backdropImage: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  releases: { [key: string]: ReleaseRead };
}

interface CloudFrontDistro {
  domain: string;
  assumeRoleArnForMainAccount: string;
  signerKeyId: string;
  usageInBytesForTheMonth: number;
}

export const handler = async (event: GetMovieParam): Promise<GetMovieMetadataResponse> => {
  let movie = await getMovie(event.movieId);
  let cfDistro;
  try {
    cfDistro = await getCloudFrontDistro();
  } catch (e) {
    console.error('Failed to retrieve CF distro:', e);
  }
  let mediaAssetsDomain;
  if (cfDistro == undefined || true) {
    mediaAssetsDomain = cloudflareMediaAssetsDomain;
  } else {
    mediaAssetsDomain = cfDistro.domain;
  }
  mediaAssetsDomain = masqueradeMediaAssetsDomain(mediaAssetsDomain);
  let mpdFile: Nullable<string>;
  let m3u8File: Nullable<string>;
  let thumbnailsFile: Nullable<string>;
  let releases = movie.releases;
  if (releases == null) releases = {};
  const release = getOneRelease(Object.values(releases));
  if (release != null) {
    mpdFile = release._mpdFile;
    m3u8File = release._m3u8File;
    thumbnailsFile = release._thumbnailsFile != null ? release._thumbnailsFile : release._thumbnails.sort((a, b) => a.resolution - b.resolution)[0].thumbnailsFile;
  }
  return {
//    subtitles: Object.keys(movie.subtitles).reduce((acc, key) => {acc[key] = `https://${mediaAssetsDomain}/${movie.subtitles[key].relativePath}`; return acc;}, {}),
    subtitles: {},
    mpdFile: `https://${mediaAssetsDomain}/${mpdFile}`,
    m3u8File: `https://${mediaAssetsDomain}/${m3u8File}`,
    thumbnailsFile: thumbnailsFile !== null ? `https://${mediaAssetsDomain}/${thumbnailsFile}` : null,
    backdropImage: movie.backdropImage,
    originalTitle: movie.originalTitle,
    titleL8ns: movie.titleL8ns,
    releaseYear: movie.releaseYear
  };
};

class FailedToGetMovieError extends Error {}

function masqueradeMediaAssetsDomain(domain: string) {
  if (domain.includes('cloudfront')) {
    return `${domain.substring(0, domain.indexOf('.'))}.default.cdn.q62.xyz`;
  }
  return 'default.cdn2.q62.xyz';
}

async function getMovie(id: string) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': id }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie: Movie = data.Item as unknown as Movie;
  return movie;
}

function getOneRelease(releases?: ReleaseRead[]) {
  if (releases == null || releases.length === 0) {
    return null;
  }
  const releasesContainsRussian: ReleaseRead[] = [];
  for (const r of releases) {
    for (const k in r._audios) {
      if (AudioLang.equals(AudioLang.RU, r._audios[k].lang)) {
        releasesContainsRussian.push(r);
      }
    }
  }
  if (releasesContainsRussian.length != 0) return releasesContainsRussian[0];
  return releases[0];
}

async function getCloudFrontDistro() {
  const cfDistros: CloudFrontDistro[] = [];
  const params = {
    TableName: dynamodbCFDistroMetadataTableName,
    ExclusiveStartKey: undefined
  }
  let items;
  do {
    items =  await docClient.scan(params);
    items.Items.forEach((item) => cfDistros.push(item as unknown as CloudFrontDistro));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  const randomSelectionSize = Math.round(cfDistros.length * cfDistroRandomSelectionProportion);
  const candidates = cfDistros.filter(_ => _.usageInBytesForTheMonth != undefined)
                              .sort((a, b) => a.usageInBytesForTheMonth - b.usageInBytesForTheMonth)
                              .slice(0, randomSelectionSize);
  if (candidates.length === 0) {
    return undefined;
  }
  const candidate = candidates[Math.floor(Math.random() * candidates.length)];
  if (candidate.usageInBytesForTheMonth > cfDistroUsageThreshold * terabiteInBytes) {
    return undefined;
  }
  return candidate;
}
