import algoliasearch from 'algoliasearch';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Catalog from '../components/Catalog';

const L8nLangCodes = {
  EN_US : { langTag : "en-US", countryCode: "US" },
  RU : { langTag : "ru", countryCode: "RU" }
} as const;
  
const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

const L8nTable = {
  EN_US : {
    TITLE: "Watch Free Movies Online"
  },
  RU : {
    TITLE: "Смотри бесплатные фильмы онлайн"
  }
}

interface MovieItem {
  id: string;
  title: string;
  releaseYear: number;
  posterImage: string;
}

interface CatalogPageProps {
  movies: MovieItem[];
  searchString: string;
  currentLocale: keyof typeof L8nLangCodes;
}

function CatalogPage(props: CatalogPageProps) {
  const router = useRouter();

  const onSearchChange = (searchString: string | null) =>
    router.push({ pathname: router.basePath, query: {search: searchString}});
  
  const onLocaleChange = (locale: string) => router.push(router.asPath,
    undefined, { locale: L8nLangCodes[locale as keyof typeof L8nLangCodes].langTag });
  
  return (
    <>
      <Head>
        <title>{L8nTable[props.currentLocale]['TITLE']}</title>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"></link>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"></link>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"></link>
        <link rel="manifest" href="/site.webmanifest"></link>
        <link rel="alternate" href="/en-US" hrefLang='en-US'></link>
        <link rel="alternate" href="/ru" hrefLang='ru'></link>
        <link rel="alternate" href="/en-US" hrefLang='x-default'></link>
      </Head>
      <Catalog {...props} currentLocale={props.currentLocale} searchString={props.searchString}
        onSearchChange={onSearchChange} onLocaleChange={onLocaleChange}/>
    </>
  )  
}

export default CatalogPage;

interface AlgoliaQueryItem {
  objectID: string;
  originalTitle: string;
  releaseYear: number;
  posterImagesPortrait: { [key: string]: string};
  titleL8ns: { [key: string]: string};
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!);
  const searchString = context.query.search as (string | undefined);
  const algoliaSearchResponse = await algoliaIndex.search<AlgoliaQueryItem>(searchString == null ? '' : searchString);
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  return { props: {
    movies: algoliaSearchResponse.hits.map(_ => ({
      id: _.objectID,
      title: _.titleL8ns[langCode] != null ? _.titleL8ns[langCode] : _.originalTitle,
      releaseYear: _.releaseYear,
      posterImage: _.posterImagesPortrait[langCode]})),
    currentLocale: langCode, 
    searchString: searchString
    }
  }
}
