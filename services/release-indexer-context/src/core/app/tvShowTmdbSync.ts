import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import axios, { AxiosInstance } from 'axios';

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
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  if (tvShow.tmdbId == null) return;
  const tvShowTmdb = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId);
  const seasons: any[] = tvShowTmdb.seasons;
  if (seasons == null) return;
  const updatedSeasons: Set<number> = new Set();
  const updatedEpisodes: { [key:number] : Set<number> } = {};
  for (let s of seasons) {
    const seasonNumber = s.season_number;
    if (seasonNumber == null || seasonNumber <= 0) continue;
    if (!tvShow.seasonExists(seasonNumber)) {
      tvShow.createSeason(seasonNumber);
      updatedSeasons.add(seasonNumber);
    }
    if (tvShow.setTmdbSeasonNumber(seasonNumber, seasonNumber)) {
      updatedSeasons.add(seasonNumber);  
    }
    const seasonDetailsEn = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.tmdbId, seasonNumber, 'en');
    const seasonDetailsRu = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.tmdbId, seasonNumber, 'ru');
    const seasonDetailsEs = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.tmdbId, seasonNumber, 'es');
    const seasonDetailsFr = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.tmdbId, seasonNumber, 'fr');
    [seasonDetailsEn, seasonDetailsRu, seasonDetailsEs, seasonDetailsFr].forEach(d => {
      if (tvShow.addNameToSeason(seasonNumber, d.name)) updatedSeasons.add(seasonNumber);
      const episodes: any[] = d.episodes;
      if (episodes == null) return;
      for (let e of episodes) {
        const episodeNumber = e.episode_number;
        if (episodeNumber == null || episodeNumber <= 0) continue;
        if (!tvShow.episodeExists(seasonNumber, episodeNumber)) {
          tvShow.createEpisode(seasonNumber, episodeNumber);
          if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
          updatedEpisodes[seasonNumber].add(episodeNumber); 
        }
        if (tvShow.setTmdbEpisodeNumber(seasonNumber, episodeNumber, episodeNumber)) {
          if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
          updatedEpisodes[seasonNumber].add(episodeNumber);   
        }
        // todo: continue
      }
    })
  }
};

async function getTvShowDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string) {
  return (await tmdbClient.get(`tv/${tmdbId}`)).data;
}

async function getSeasonDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, seasonNumber: number, locale: string) {
  return (await tmdbClient.get(`tv/${tmdbId}/season/${seasonNumber}?language=${locale}`)).data;
}
