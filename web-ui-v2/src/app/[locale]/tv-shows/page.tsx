
import { searchClient } from '@algolia/client-search';
import TvShowsPage from './tvshows-page';
import { getLocale } from 'next-intl/server';
import { Locale } from '@/i18n/routing';
import { yearToEpochMillis } from '../page';

const algoliaClient = searchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {});

export async function getRecentTVShowUpdates(locale: string) { 
  const langKey = Locale.FROM_LANG_TAG[locale].key || 'EN_US';
  const algoliaResponse = await algoliaClient.search({
        requests: [ {
          indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
          query: '',
          filters: 'category:TV_SHOW',
          hitsPerPage: 1000
        }]});
  return algoliaResponse.results[0].hits.sort((a: any, b: any) => {
    const aLatestAirDateMillis = a.latestAirDateMillis || yearToEpochMillis(a.releaseYear);
    const bLatestAirDateMillis = b.latestAirDateMillis || yearToEpochMillis(b.releaseYear);
    return bLatestAirDateMillis - aLatestAirDateMillis;
  }).map((h: any) => ({
    id: h.objectID,
    title: h.titleL8ns[langKey] || h.titleL8ns['EN_US'],
    year: `${h.releaseYear}`,
    season: h.latestSeason,
    episode: h.latestEpisode,
    posterImagePath: h.posterImagesPortrait[langKey] || h.posterImagesPortrait[langKey]['EN_US']
  }));
}
 
export default async function Page() {
  const locale = await getLocale();
  const recentTvShowUpdates = await getRecentTVShowUpdates(locale);
  return <TvShowsPage recentTvShowUpdates={recentTvShowUpdates}/>
}
