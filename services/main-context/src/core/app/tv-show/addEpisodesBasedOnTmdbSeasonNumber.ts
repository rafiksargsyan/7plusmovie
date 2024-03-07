import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { TvShowRepository } from '../../../adapters/TvShowRepository';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

interface Episode {
  tmdbEpisodeNumber: number;
}
    
interface Season {
  episodes: Episode[];
  tmdbSeasonNumber: number;
  seasonNumber;
}

interface TvShowRead {
  seasons: Season[];
  tmdbId: string;
}

interface Param {
  tvShowId?: string;
  seasonNumber?: number;
}

export const handler = async (event: Param): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);  
  const tmdbApiKey = secret.TMDB_API_KEY!;
 
  let tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  let tvShowRead: TvShowRead = tvShow as unknown as TvShowRead;

  const season = tvShowRead.seasons.filter(_ => _.seasonNumber === event.seasonNumber)[0];

  if (tvShowRead.tmdbId == undefined) {
    throw new MissingTmdbIdError();
  }

  if (season == undefined) {
    throw new SeasonNotFoundError();
  }

  if (season.tmdbSeasonNumber == undefined) {
   throw new MissingTmdbSeasonNumberError();
  }

  const tmdbSeason = (await tmdbClient.get(`tv/${tvShowRead.tmdbId}/season/${season.tmdbSeasonNumber}?api_key=${tmdbApiKey}`)).data;

  for (const tmdbEpisode of tmdbSeason.episodes) {
    const tmdbEpisodeNumber = tmdbEpisode.episode_number;
    const tmdbEpisodeName = tmdbEpisode.name;
    try {
      tvShow.addEpisodeToSeason(event.seasonNumber, tmdbEpisodeName, tmdbEpisodeNumber);
      tvShow.addTmdbEpisodeNumber(event.seasonNumber, tmdbEpisodeNumber, tmdbEpisodeNumber);
    } catch (e) {
      console.error(e);
    }
  }

  await tvShowRepo.saveTvShow(tvShow);
}

class SeasonNotFoundError extends Error {}

class MissingTmdbSeasonNumberError extends Error {}

class MissingTmdbIdError extends Error {}
