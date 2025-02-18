import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../../adapters/TvShowRepository';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { ReleaseRead } from '../../domain/entity/Release';
import { AudioLang } from '../../domain/AudioLang';
import { Nullable } from '../../../utils';
import { getOneRelease, getRelease } from '../getMovieMetadataForPlayer';
import { L8nLangCode } from '../../domain/L8nLangCodes';

const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const cfDistroRandomSelectionProportion = Number.parseFloat(process.env.CF_DISTRO_RANDOM_SELECTION_PROPORTION!);
const cfDistroUsageThreshold = Number.parseFloat(process.env.CF_DISTRO_USAGE_THRESHOLD!);
const cloudflareMediaAssetsDomain = process.env.CLOUDFLARE_MEDIA_ASSETS_DOMAIN!;
const cloudflareMediaAssetsCachableDomain = process.env.CLOUDFLARE_MEDIA_ASSETS_CACHABLE_DOMAIN!;

const terabiteInBytes = 1_000_000_000_000; // Max free outgoing traffic for Cloudfront is 1TB

const docClient = DynamoDBDocument.from(new DynamoDB({}));
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface GetTvShowParam {
  tvShowId: string
  season: number
  episode: number
  releaseId: string
  preferredAudioLang: string
}

interface GetTvShowMetadataResponse {
  subtitles: { [key: string]: string };
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile?: string;
  stillImage: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  seasonOriginalName: string;
  seasonNameL8ns: { [key: string]: string };
  episodeOriginalName: string;
  episodeNameL8ns: { [key: string]: string };
  releaseYear: number;
  originalLocale: string;
}

interface TvShow {
  id: string
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  seasons: Season[];
  releaseYear: number;
  originalLocale: L8nLangCode;
}

interface Episode {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  mpdFile: string;
  m3u8File: string;
  episodeNumber: number;
  thumbnailsFile?: string;
  releases: { [key: string]: ReleaseRead };
}
  
interface Season {
  originalName: string;
  nameL8ns: { [key: string]: string };
  episodes: Episode[];
  seasonNumber: number;
}

interface CloudFrontDistro {
  domain: string;
  assumeRoleArnForMainAccount: string;
  signerKeyId: string;
  usageInBytesForTheMonth: number;
}

export const handler = async (event: GetTvShowParam): Promise<GetTvShowMetadataResponse> => {
  const tvShow = (await getTvShow(event.tvShowId) as unknown as TvShow);
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
  const season = tvShow.seasons.filter(_ => _.seasonNumber == event.season)[0];
  if (season == undefined) {
    throw new TvShowSeasonNotFoundError();
  }
  const episode = season.episodes.filter(_ => _.episodeNumber == event.episode)[0];
  if (episode == undefined) {
    throw new TvShowEpisodeNotFoundError();
  }
  let mpdFile: Nullable<string>;
  let m3u8File: Nullable<string>;
  let thumbnailsFile: Nullable<string>;
  let releases = episode.releases;
  if (releases == null) releases = {};
  let preferredAudioLang = AudioLang.fromKey(event.preferredAudioLang)
  if (preferredAudioLang == null) preferredAudioLang = AudioLang.RU
  let release = event.releaseId != null ? getRelease(releases, event.releaseId) : null;
  if (release == null) {
    release = getOneRelease(Object.values(releases), preferredAudioLang);
  }
  let releaseSubtitles = release?._subtitles;
  if (releaseSubtitles == null) releaseSubtitles = {};
  let subtitles = {};
  if (release != null) {
    mpdFile = release._mpdFile;
    m3u8File = release._m3u8File;
    thumbnailsFile = release._thumbnails.sort((a, b) => a.resolution - b.resolution)[0].thumbnailsFile;
    Object.entries(releaseSubtitles).forEach(([k, s]) => subtitles[k] = {
      name: s.name,
      url: `https://${mediaAssetsDomain}/${s.relativePath}`,
      lang: s.lang.key,
      type: s.type?.key
    })
  }
  return {
    releaseYear: tvShow.releaseYear,
    subtitles: subtitles,
    mpdFile: `https://${mediaAssetsDomain}/${mpdFile}`,
    m3u8File: `https://${mediaAssetsDomain}/${m3u8File}`,
    thumbnailsFile: thumbnailsFile !== undefined ? `https://${cloudflareMediaAssetsCachableDomain}/${thumbnailsFile}` : undefined,
    stillImage: episode.stillImage,
    originalTitle: tvShow.originalTitle,
    titleL8ns: tvShow.titleL8ns,
    seasonOriginalName: season.originalName,
    seasonNameL8ns: season.nameL8ns,
    episodeOriginalName: episode.originalName,
    episodeNameL8ns: episode.nameL8ns,
    originalLocale: tvShow.originalLocale.code
  };
};

class TvShowSeasonNotFoundError extends Error {}

class TvShowEpisodeNotFoundError extends Error {}

function masqueradeMediaAssetsDomain(domain: string) {
  if (domain.includes('cloudfront')) {
    return `${domain.substring(0, domain.indexOf('.'))}.default.cdn.q62.xyz`;
  }
  return 'default.cdn2.q62.xyz';
}

async function getTvShow(id: string) {
  return await tvShowRepo.getTvShowById(id);
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
