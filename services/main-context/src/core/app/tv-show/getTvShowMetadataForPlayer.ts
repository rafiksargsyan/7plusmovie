import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;
const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));

interface GetTvShowParam {
  tvShowId: string;
  season: number;
  episode: number;
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
}

interface TvShow {
  id: string
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  seasons: Season[];
  releaseYear: number;
}

interface Episode {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  mpdFile: string;
  m3u8File: string;
  subtitles: { [key: string]: string };
  episodeNumber: number;
  thumbnailsFile?: string;
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
}

export const handler = async (event: GetTvShowParam): Promise<GetTvShowMetadataResponse> => {
  const tvShow = await getTvShow(event.tvShowId);
  const cfDistro = await getRandomCloudFrontDistro();
  const season = tvShow.seasons.filter(_ => _.seasonNumber == event.season)[0];
  if (season == undefined) {
    throw new TvShowSeasonNotFoundError();
  }
  const episode = season.episodes.filter(_ => _.episodeNumber == event.episode)[0];
  if (episode == undefined) {
    throw new TvShowEpisodeNotFoundError();
  }
  return {
    releaseYear: tvShow.releaseYear,
    subtitles: Object.keys(episode.subtitles)
    .reduce((acc, key) => {acc[key] = `https://${cfDistro.domain}/${episode.subtitles[key]}`; return acc;}, {}),
    mpdFile: `https://${cfDistro.domain}/${episode.mpdFile}`,
    m3u8File: `https://${cfDistro.domain}/${episode.m3u8File}`,
    thumbnailsFile: episode.thumbnailsFile !== undefined ? `https://${cfDistro.domain}/${movie.thumbnailsFile}` : undefined,
    stillImage: episode.stillImage,
    originalTitle: tvShow.originalTitle,
    titleL8ns: tvShow.titleL8ns,
    seasonOriginalName: season.originalName,
    seasonNameL8ns: season.nameL8ns,
    episodeOriginalName: episode.originalName,
    episodeNameL8ns: episode.nameL8ns
  };
};

class FailedToGetTvShowError extends Error {}

class TvShowSeasonNotFoundError extends Error {}

class TvShowEpisodeNotFoundError extends Error {}

async function getTvShow(id: string) {
  const queryParams = {
    TableName: dynamodbTvShowTableName,
    Key: { 'id': id }
  } as const;
  let data = await docClient.get(queryParams);
  if (data == undefined || data.Item == undefined) {
    throw new FailedToGetTvShowError();
  }
  let tvShow: TvShow = data.Item as unknown as TvShow;
  return tvShow;
}

async function getRandomCloudFrontDistro() {
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
  } while (typeof items.LastEvaluatedKey != "undefined");
  const randomIndex = Math.floor(Math.random() * cfDistros.length);
  return cfDistros[randomIndex];
}
