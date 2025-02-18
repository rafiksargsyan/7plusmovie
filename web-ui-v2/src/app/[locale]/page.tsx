import { searchClient } from '@algolia/client-search';
import { getLocale } from 'next-intl/server';
import { Locale } from '@/i18n/routing';
import HomePage from './home-page';
import { createClient } from 'redis';

const algoliaClient = searchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {});

export const MONTH_IN_MILLIS = 30 * 24 * 60 * 60 * 1000;

export function yearToEpochMillis(year: number) {
  return Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime());
}

export async function getOrUpdateCache(f: () => Promise<any>, key: string, timeout: number) {
  let redis = null;
  try {
    redis = await createClient({ url: process.env.REDIS_URL,
      socket: {
        reconnectStrategy: () => Error("Don't retry")
      }
    });
  
    redis.on('error', (err: any) => console.error('Redis Client Error', err));
    
    await redis.connect();
  } catch (e) {
    redis = null;
  }
  let payload = null;
  if (redis != null) {
    let cached = null;
    try {
      cached = await redis.get(key);
    } catch (e) {
      console.error(`Got error while querying redis for ${key}`, e);
    }
    if (cached == null) {
      payload = await f();
      try {
        await redis.setEx(key, timeout, JSON.stringify(payload));
      } catch (e) {
        console.error(`Got error while setting redis key for ${key}`, e);
      }
    } else {
      payload = JSON.parse(cached);
    }
  } else {
   payload = await f();
  }
  return payload;
}

async function getRecentMovieReleasesCached(locale: string) {
  return getOrUpdateCache(() => getRecentMovieReleases(locale), 'recentMovieReleases', 3600); 
}

export async function getRecentMovieReleases(locale: string) {
  const langKey = Locale.FROM_LANG_TAG[locale].key || 'EN_US';
  const algoliaResponse = await algoliaClient.search({
        requests: [ {
          indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
          query: '',
          filters: 'category:MOVIE',
          hitsPerPage: 1000
        }]});
  return (algoliaResponse.results[0] as any).hits.filter((m: any) => { return new Date().getFullYear() - m.releaseYear < 2 }).sort((a: any, b: any) => {
    const currentTime = Date.now();
    const aReleaseTimeInMillis = a.releaseTimeInMillis || yearToEpochMillis(a.releaseYear);
    const bReleaseTimeInMillis = b.releaseTimeInMillis || yearToEpochMillis(b.releaseYear);
    const aLatestReleaseTime = a.latestReleaseTime || a.creationTime;
    const bLatestReleaseTime = b.latestReleaseTime || b.creationTime;
    if (currentTime - aReleaseTimeInMillis < 3 * MONTH_IN_MILLIS || currentTime - bReleaseTimeInMillis < 3 * MONTH_IN_MILLIS) {
      return bReleaseTimeInMillis - aReleaseTimeInMillis;  
    }
    return bLatestReleaseTime - aLatestReleaseTime;
  }).slice(0, 15).map((h: any) => ({
    id: h.objectID,
    title: h.titleL8ns[langKey] || h.titleL8ns['EN_US'],
    year: `${h.releaseYear}`,
    quality: h.latestReleaseQuality,
    releaseId: h.latestReleaseId,
    posterImagePath: h.posterImagesPortrait[langKey] || h.posterImagesPortrait['EN_US']
  }));
}

async function getRecentTVShowUpdatesCached(locale: string) {
  return getOrUpdateCache(() => getRecentTVShowUpdates(locale), 'recentTVShowUpdates', 3600); 
}

export async function getRecentTVShowUpdates(locale: string) {
  const currentTime = Date.now();  
  const langKey = Locale.FROM_LANG_TAG[locale].key || 'EN_US';
  const algoliaResponse = await algoliaClient.search({
        requests: [ {
          indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
          query: '',
          filters: 'category:TV_SHOW',
          hitsPerPage: 1000
        }]});
  return (algoliaResponse.results[0] as any).hits.filter((t: any) => t.objectID !== '6d4a2151-7cc7-4191-8738-b4d4be093330').sort((a: any, b: any) => {
    const aLatestAirDateMillis = a.latestAirDateMillis || yearToEpochMillis(a.releaseYear);
    const bLatestAirDateMillis = b.latestAirDateMillis || yearToEpochMillis(b.releaseYear);
    const aLatestReleasetime = a.latestReleaseTime || aLatestAirDateMillis;
    const bLatestReleasetime = b.latestReleaseTime || bLatestAirDateMillis;
    if (currentTime - aLatestAirDateMillis < 3 * MONTH_IN_MILLIS || currentTime - bLatestAirDateMillis < 3 * MONTH_IN_MILLIS) {
      return bLatestAirDateMillis - aLatestAirDateMillis;
    }
    return bLatestReleasetime - aLatestReleasetime;
  }).slice(0, 10).map((h: any) => ({
    id: h.objectID,
    title: h.titleL8ns[langKey] || h.titleL8ns['EN_US'],
    year: `${h.releaseYear}`,
    releaseId: h.latestReleaseId,
    season: h.latestSeason,
    episode: h.latestEpisode,
    posterImagePath: h.posterImagesPortrait[langKey] || h.posterImagesPortrait['EN_US']
  }));
}

export default async function Page() {
  const locale = await getLocale();
  const recentMovieReleases = await getRecentMovieReleasesCached(locale);
  const recentTvShowUpdates = await getRecentTVShowUpdatesCached(locale);
  return <HomePage recentMovieReleases={recentMovieReleases} recentTvShowUpdates={recentTvShowUpdates}/>
}
