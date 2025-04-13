import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { TvShowRepository } from '../../adapters/TvShowRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import axios, { AxiosInstance } from 'axios';
import { strIsBlank } from '../../utils';
import { TvdbClient } from '../../adapters/TvdbClient';
import { TmdbClient } from '../../adapters/TmdbClient';

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
  const tvdbApiKey = secret.TVDB_API_KEY!;
  tmdbClient.interceptors.request.use((config) => {
    config.params = config.params || {};
    config.params['api_key'] = tmdbApiKey;
    return config;
  });
  const tvdbClient = new TvdbClient('https://api4.thetvdb.com/v4/', tvdbApiKey);
  const tmdbClient2 = new TmdbClient('https://api.themoviedb.org/3/', tmdbApiKey)
  const tvShow = await tvShowRepo.getById(event.tvShowId);
  let rootUpdated = false;
  if (tvShow.tvdbId != null) {
    const tmdbId = await tmdbClient2.getIdByTvdbId(tvShow.tvdbId);
    if (tmdbId != null) {
      rootUpdated = rootUpdated || tvShow.setTmdbId(`${tmdbId}`);
    }
  } else if (tvShow.tmdbId != null) {
    const tvdbId = (await tmdbClient2.getTvShowExternalIds(Number.parseInt(tvShow.tmdbId))).tvdbId;
    if (tvdbId != null) {
      rootUpdated = rootUpdated || tvShow.setTvdbId(tvdbId);
    }
  }
  if (tvShow.tmdbId == null && tvShow.tvdbId == null) return; 
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
    const tvdbTvShow = await tvdbClient.getTvShowById(tvShow.tvdbId);
    for (const l of ['eng', 'rus', 'spa', 'fra', 'ita']) {
      if (tvdbTvShow.nameTranslations.includes(l)) {
        const tvdbTvShowTranslation = await tvdbClient.getTvShowTranslation(tvShow.tvdbId, l);
        rootUpdated = tvShow.addName(tvdbTvShowTranslation.name) || rootUpdated;
      }
    }
  }
  if (!tvShow.useTvdb || tvShow.tvdbId == null) {
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
    const tvdbEpisodes = await tvdbClient.getTvShowEpisodes(tvShow.tvdbId);
    for (const te of tvdbEpisodes) {
      const updatedSeasons: Set<number> = new Set();
      const updatedEpisodes: { [key:number] : Set<number> } = {};
      const seasonNumber = te.seasonNumber;
      if (seasonNumber == null || seasonNumber <= 0) continue;
      if (!tvShow.seasonExists(seasonNumber)) {
        tvShow.createSeason(seasonNumber);
        updatedSeasons.add(seasonNumber);
      }
      if (tvShow.setTvdbSeasonNumber(seasonNumber, seasonNumber)) {
        updatedSeasons.add(seasonNumber);  
      }
      const episodeNumber = te.number;
      if (episodeNumber == null || episodeNumber <= 0) continue;
      if (!tvShow.episodeExists(seasonNumber, episodeNumber)) {
        tvShow.createEpisode(seasonNumber, episodeNumber);
        if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
        updatedEpisodes[seasonNumber].add(episodeNumber); 
      }
      if (tvShow.setTvdbEpisodeNumber(seasonNumber, episodeNumber, episodeNumber)) {
        if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
        updatedEpisodes[seasonNumber].add(episodeNumber);   
      }
      if (te.runtimeMinutes != null && te.runtimeMinutes > 0) {
        if (tvShow.setEpisodeRuntime(seasonNumber, episodeNumber, te.runtimeMinutes * 60)) {
          if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
          updatedEpisodes[seasonNumber].add(episodeNumber);
        }
      }
      if (!strIsBlank(te.aired)) {
        const airDateMillis = new Date(te.aired!).getTime();
        if (tvShow.setEpisodeAirDateInMillis(seasonNumber, episodeNumber, airDateMillis)) {
          if (updatedEpisodes[seasonNumber] == null) updatedEpisodes[seasonNumber] = new Set();
          updatedEpisodes[seasonNumber].add(episodeNumber);
        }  
      }
      await tvShowRepo.save(tvShow, rootUpdated, Array.from(updatedSeasons), Object.keys(updatedEpisodes).reduce((aggr, k) => {
        aggr[k] = Array.from(updatedEpisodes[k]);
        return aggr;
      }, {}))
    }
  }
};

async function getTvShowDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, locale: string) {
  return (await tmdbClient.get(`tv/${tmdbId}?language=${locale}`)).data;
}

async function getSeasonDetailsFromTmdb(tmdbClient: AxiosInstance, tmdbId: string, seasonNumber: number) {
  return (await tmdbClient.get(`tv/${tmdbId}/season/${seasonNumber}`)).data;
}
