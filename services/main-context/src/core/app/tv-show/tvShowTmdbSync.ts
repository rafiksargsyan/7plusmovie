import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import axios, { AxiosInstance } from 'axios';
import { TvShowRepository } from '../../../adapters/TvShowRepository';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo = new TvShowRepository(docClient);

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const secretsManager = new SecretsManager({});

export const handler = async (event: { tvShowId: string }): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const tmdbApiKey = secret.TMDB_API_KEY!;
  tmdbClient.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params['api_key'] = tmdbApiKey;
    return config;
  });
  const tvShow = await tvShowRepo.getTvShowById(event.tvShowId);
  if (tvShow.getTmdbId() == null) return;
  const tvShowTmdb = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.getTmdbId());
  let updated = false;
  const seasons: any[] = tvShowTmdb.seasons;
  if (seasons == null) return;
  for (let s of seasons) {
    const seasonNumber = s.season_number;
    if (seasonNumber == null || seasonNumber <= 0) continue;
    if (!tvShow.seasonExists(seasonNumber)) {
      const seasonOriginalName = s.name; 
      tvShow.addSeason(seasonOriginalName, seasonNumber);
      updated = true;
    }
    if (tvShow.addTmdbSeasonNumberToSeason(seasonNumber, seasonNumber)) {
      updated = true;
    }
    const seasonDetails = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.getTmdbId(), seasonNumber);
    const episodes: any[] = seasonDetails.episodes;
    if (episodes == null) continue;
    for (let e of episodes) {
      const episodeNumber = e.episode_number;
      if (episodeNumber == null || episodeNumber <= 0) continue;
      if (!tvShow.episodeExists(seasonNumber, episodeNumber)) {
        const episodeOriginalName = e.name;
        tvShow.addEpisodeToSeason(seasonNumber, episodeOriginalName, episodeNumber);
        tvShow.setMonitorReleases(seasonNumber, episodeNumber, true);
        updated = true;
      }
      if (tvShow.addTmdbEpisodeNumber(seasonNumber, episodeNumber, episodeNumber)) {
        updated = true;  
      }
    }
  }
  if (updated) {
    await tvShowRepo.saveTvShow(tvShow);
  }
};

async function getTvShowDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string) {
  return (await tmdbClient.get(`tv/${tmdbId}`)).data;
}

async function getSeasonDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, seasonNumber: number) {
  return (await tmdbClient.get(`tv/${tmdbId}/season/${seasonNumber}`)).data;
}
