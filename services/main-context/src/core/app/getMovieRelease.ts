import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ReleaseRead } from '../domain/entity/Release';
import { Nullable } from '../../utils';
import { getCloudFrontDistro } from './getMovieMetadataForPlayer';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const cloudflareMediaAssetsDomain = process.env.CLOUDFLARE_MEDIA_ASSETS_DOMAIN!;
const cloudflareMediaAssetsCachableDomain = process.env.CLOUDFLARE_MEDIA_ASSETS_CACHABLE_DOMAIN!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));  

interface GetMovieReleaseParam {
  movieId: string
  releaseId: string
}

interface GetMovieReleaseResponse {
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

export const handler = async (event: GetMovieReleaseParam): Promise<GetMovieReleaseResponse> => {
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
  const release = getRelease(releases, event.releaseId);
  if (release != null) {
    mpdFile = release._mpdFile;
    m3u8File = release._m3u8File;
    thumbnailsFile = release._thumbnails.sort((a, b) => a.resolution - b.resolution)[0].thumbnailsFile;
  }
  return {
    subtitles: {}, // TODO
    mpdFile: `https://${mediaAssetsDomain}/${mpdFile}`,
    m3u8File: `https://${mediaAssetsDomain}/${m3u8File}`,
    thumbnailsFile: thumbnailsFile !== null ? `https://${cloudflareMediaAssetsCachableDomain}/${thumbnailsFile}` : null,
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

export function getRelease(releases: { [id:string]: ReleaseRead }, releaseId: string) {
  return releases[releaseId];
}
