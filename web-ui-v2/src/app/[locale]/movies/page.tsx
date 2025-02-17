import { searchClient } from '@algolia/client-search';
import MoviesPage from './movies-page';
import { getLocale } from 'next-intl/server';
import { Locale } from '@/i18n/routing';
import { yearToEpochMillis } from '../page';
import '@algolia/autocomplete-theme-classic';

const algoliaClient = searchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {});

async function getMovieReleases(locale: string, query: string) {
  const langKey = Locale.FROM_LANG_TAG[locale].key || 'EN_US';
  const algoliaResponse = await algoliaClient.search({
        requests: [ {
          indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
          query: query,
          filters: 'category:MOVIE',
          hitsPerPage: 1000
        }]});
  return (algoliaResponse.results[0] as any).hits.sort((a: any, b: any) => {
    const aReleaseTimeInMillis = a.releaseTimeInMillis || yearToEpochMillis(a.releaseYear);
    const bReleaseTimeInMillis = b.releaseTimeInMillis || yearToEpochMillis(b.releaseYear);
    return bReleaseTimeInMillis - aReleaseTimeInMillis;  
  }).map((h: any) => ({
    id: h.objectID,
    title: h.titleL8ns[langKey] || h.titleL8ns['EN_US'],
    year: `${h.releaseYear}`,
    quality: h.maxQuality,
    posterImagePath: h.posterImagesPortrait[langKey] || h.posterImagesPortrait['EN_US']
  }));
}
 
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const locale = await getLocale();
  const query = (await searchParams).q as string;
  return <MoviesPage recentMovieReleases={await getMovieReleases(locale, query)} query={query}/>
}
