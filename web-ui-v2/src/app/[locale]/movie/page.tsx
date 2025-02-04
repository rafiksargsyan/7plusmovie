
import { searchClient } from '@algolia/client-search';
import MoviesPage from './movie-page';
import { getLocale } from 'next-intl/server';
import { Locale } from '@/i18n/routing';

const algoliaClient = searchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {});

export async function getRecentMovieReleases(locale: string) {
  const langKey = Locale.FROM_LANG_TAG[locale].key || 'EN_US';
  const algoliaResponse = await algoliaClient.search({
        requests: [ {
          indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
          query: '',
          filters: 'category:MOVIE'
        }]});
  return algoliaResponse.results[0].hits.map((h: any) => ({
    title: h.titleL8ns[langKey] || h.titleL8ns['EN_US'],
    year: `${h.releaseYear}`,
    quality: 'TODO',
    releaseId: 'TODO',
    posterImagePath: h.posterImagesPortrait[langKey] || h.posterImagesPortrait[langKey]['EN_US']
  }));
}
 
export default async function Page() {
  const locale = await getLocale();
  const recentMovieReleases = await getRecentMovieReleases(locale);
  return <MoviesPage recentMovieReleases={recentMovieReleases} />
}
