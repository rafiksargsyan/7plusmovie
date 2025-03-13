import { Nullable } from '@/types/Nullable';
import { searchClient as algoliaSearchClient } from '@algolia/client-search';
import { SearchClient as TypesenseSearchClient } from "typesense";

const useAlgolia = process.env.NEXT_PUBLIC_USE_ALGOLIA === 'true'

const algoliaClient = useAlgolia ? algoliaSearchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {}) : null;

const typesenseClient = useAlgolia ? null : new TypesenseSearchClient({
  'nodes': [{
    'host': 'typesense.q62.xyz',
    'port': 8108,
    'protocol': 'http'
  }],
  'apiKey': process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_KEY!,
 })

export async function searchMovies(query: Nullable<string>) {
  if (algoliaClient != null) {
    const algoliaResponse = await algoliaClient.search({
      requests: [ {
        indexName: process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
        query: query || '',
        filters: 'category:MOVIE',
        hitsPerPage: 1000
      }]});
    return (algoliaResponse.results[0] as any).hits.map((h: any) => ({
      id: h.objectID,
      ...h
    }))
  } else if (typesenseClient != null) {
    const ret: any[] = [];
    const pageSize = 250;
    let lastPageSize: number | undefined = 250;
    let page = 1;
    while (lastPageSize === 250) {
      const tsResponse = await typesenseClient.collections(process.env.NEXT_PUBLIC_TYPESENSE_COLLECTION_MOVIES!).documents().search({
        'q': query || '',
        'query_by': '*',
        'per_page': pageSize,
        'page': page
      }, {})
      lastPageSize = tsResponse.hits?.length;
      ++page;
      const hits = tsResponse.hits?.map((h: any) => h.document);
      hits != null && ret.push(...hits);
    }
    return ret;
  }
}  