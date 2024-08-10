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
  episodeNumber: number;
  thumbnailsFile?: string;
  releases: { [key: string]: any }
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
  let seasons = tvShow.seasons
  seasons.forEach(s => {
    s.episodes = s.episodes.filter(e => e.releases != null && Object.keys(e.releases).length !== 0)
  })
  seasons = seasons.filter(s => s.episodes.length !== 0)
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
