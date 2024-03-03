import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../../adapters/TvShowRepository';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';

const docClient = DynamoDBDocument.from(new DynamoDB({}));
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface GetTvShowParam {
  tvShowId: string;
}

interface GetTvShowMetadataResponse {
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  seasons: Season[];
  posterImagesPortrait: { [key: string]: string };
}

interface TvShow {
  id: string
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  seasons: Season[];
  releaseYear: number;
  posterImagesPortrait: { [key: string]: string };
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
  posterImagesPortrait: { [key: string]: string };
  tmdbSeasonNumber: number;
}

export const handler = async (event: GetTvShowParam): Promise<GetTvShowMetadataResponse> => {
  const tvShow = (await getTvShow(event.tvShowId) as unknown as TvShow);
  let seasons = tvShow.seasons.map(_ => ({
    ..._,
    episodes: _.episodes.filter(e => e.mpdFile != undefined && e.m3u8File != undefined)
  }));
  seasons = seasons.filter(_ => _.episodes.length != 0);
  return {
    releaseYear: tvShow.releaseYear,
    originalTitle: tvShow.originalTitle,
    titleL8ns: tvShow.titleL8ns,
    posterImagesPortrait: tvShow.posterImagesPortrait,
    seasons: seasons
  };
};

async function getTvShow(id: string) {
  return await tvShowRepo.getTvShowById(id);
}
