import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import { handler as addEpisodeToTvShow } from './addEpisodeToTvShow';
import { handler as addTmdbEpisodeNumber } from "./addTmdbEpisodeNumber";

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

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

  const queryParams = {
    TableName: dynamodbTvShowTableName,
    Key: { 'id': event.tvShowId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data?.Item === undefined) {
    throw new FailedToGetTvShowError();
  }
  let tvShow: TvShowRead = data.Item as TvShowRead;

  const season = tvShow.seasons.filter(_ => _.seasonNumber === event.seasonNumber)[0];

  if (tvShow.tmdbId == undefined) {
    throw new MissingTmdbIdError();
  }

  if (season == undefined) {
    throw new SeasonNotFoundError();
  }

  if (season.tmdbSeasonNumber == undefined) {
   throw new MissingTmdbSeasonNumberError();
  }

  const tmdbSeason = (await tmdbClient.get(`tv/${tvShow.tmdbId}/season/${season.tmdbSeasonNumber}?api_key=${tmdbApiKey}`)).data;

  for (const tmdbEpisode of tmdbSeason.episodes) {
    const tmdbEpisodeNumber = tmdbEpisode.episode_number;
    const tmdbEpisodeName = tmdbEpisode.name;
    try {
      await addEpisodeToTvShow({tvShowId: event.tvShowId, originalName: tmdbEpisodeName,
                                seasonNumber: event.seasonNumber, episodeNumber: tmdbEpisodeNumber});
      await addTmdbEpisodeNumber({tvShowId: event.tvShowId, tmdbEpisodeNumber: tmdbEpisodeNumber,
                                  seasonNumber: event.seasonNumber, episodeNumber: tmdbEpisodeNumber});
    } catch (e) {
      console.error(e);
    }
  }
}

class FailedToGetTvShowError extends Error {}

class SeasonNotFoundError extends Error {}

class MissingTmdbSeasonNumberError extends Error {}

class MissingTmdbIdError extends Error {}
