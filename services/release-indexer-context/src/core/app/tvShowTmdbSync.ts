import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import axios, { AxiosInstance } from 'axios';
import { strIsBlank } from '../../utils';

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
  if (tvShow.tvdbId != null) {
    // get tmdbId using tvdbId and set if not set
  } else if (tvShow.tmdbId != null) {
    // get tvdbId using tmdbId and set if not set
  }
  if (tvShow.tmdbId == null && tvShow.tvdbId == null) return;
  let rootUpdated = false;
  let tvShowTmdbEn = null;
  if (tvShow.tmdbId != null) {
    tvShowTmdbEn = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId, 'en');
    const tvShowTmdbRu = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId, 'ru');
    const tvShowTmdbEs = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId, 'es');
    const tvShowTmdbFr = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId, 'fr');
    const tvShowTmdbIt = await getTvShowDetailsFromTmdb(tmdbClient, tvShow.tmdbId, 'it');
  
    [tvShowTmdbEn, tvShowTmdbRu, tvShowTmdbEs, tvShowTmdbFr, tvShowTmdbIt].forEach(t => {
      rootUpdated = tvShow.addName(t.name) || rootUpdated
    })
  }
  if (tvShow.tvdbId != null) {
    // populate names from TVDB
  }
  if (tvShow.tvdbId == null) {
    // tvShowTmdbEn can't be null
    const seasons: any[] = (tvShowTmdbEn as any).seasons;
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
      // tvShow.tmdbId can't be null
      const seasonDetails = await getSeasonDetailsFromTmdb(tmdbClient, tvShow.tmdbId!, seasonNumber);
      const episodes: any[] = seasonDetails.episodes;
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
        if (e.runtime != null && e.runtime > 0) {
          if (tvShow.setEpisodeRuntime(seasonNumber, episodeNumber, e.runtime * 60)) {
            if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
            updatedEpisodes[seasonNumber].add(episodeNumber);
          }
        }
        if (!strIsBlank(e.air_date)) {
          const airDateMillis = new Date(e.air_date).getTime();
          if (tvShow.setEpisodeAirDateInMillis(seasonNumber, episodeNumber, airDateMillis)) {
            if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
            updatedEpisodes[seasonNumber].add(episodeNumber);
          }  
        }
      }
    }
    await tvShowRepo.save(tvShow, rootUpdated, Array.from(updatedSeasons), Object.keys(updatedEpisodes).reduce((aggr, k) => {
     aggr[k] = Array.from(updatedEpisodes[k]);
     return aggr;
    }, {}))
  } else {
    // create seasons/episodes from TVDB
  }
};

async function getTvShowDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, locale: string) {
  return (await tmdbClient.get(`tv/${tmdbId}?language=${locale}`)).data;
}

async function getSeasonDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, seasonNumber: number) {
  return (await tmdbClient.get(`tv/${tmdbId}/season/${seasonNumber}`)).data;
}
