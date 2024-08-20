import algoliasearch from 'algoliasearch';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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
    TITLE: "Watch Free Movies Online",
    DESC: "Good movies are like good books, they are timeless. Our mission is to make the best movies of all time accessible to everyone."
  },
  RU : {
    TITLE: "Смотри бесплатные фильмы онлайн",
    DESC: "Хорошие фильмы похожи на хорошие книги, они вне времени. Наша миссия — сделать лучшие фильмы всех времен доступными для всех."
  }
}

declare var kofiWidgetOverlay: any

interface MovieItem {
  id: string;
  originalTitle: string;
  titleL8ns: {[key: string]: string};
  releaseYear: number;
  posterImagesPortrait: {[key: string]: string};
  category: "TV_SHOW" | "MOVIE";
}

interface CatalogPageProps {
  movies: MovieItem[];
  searchString: string;
  currentLocale: keyof typeof L8nLangCodes;
}

function CatalogPage(props: CatalogPageProps) {
  const router = useRouter();
  const [locale, setLocale] = useState(props.currentLocale);
  const [search, setSearch] = useState(props.searchString);

  const onSearchChange = (searchString: string | null) => {
    router.replace({ pathname: router.basePath, query: {search: searchString}});
    setSearch(searchString != null ? searchString : '');
  };
  
  const onLocaleChange = (locale: string) => {
    router.replace(router.asPath, undefined, { locale: L8nLangCodes[locale as keyof typeof L8nLangCodes].langTag });
    setLocale(locale as keyof typeof L8nLangCodes);
  }

  useEffect(() => {
    kofiWidgetOverlay.draw('q62xyz', {
      'type': 'floating-chat',
      'floating-chat.donateButton.text': 'Support Us',
      'floating-chat.donateButton.background-color': '#00b9fe',
      'floating-chat.donateButton.text-color': '#fff'
    });
  })

  return (
    <>
      <Head>
        <title>{L8nTable[props.currentLocale]['TITLE']}</title>
        <meta property="og:image" content="/ogImage.jpg" />
        <meta property="og:title" content={L8nTable[props.currentLocale]['TITLE']} />
        <meta name="description" content={L8nTable[props.currentLocale]['DESC']} />
        <meta property="og:description" content={L8nTable[props.currentLocale]['DESC']} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"></link>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"></link>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"></link>
        <link rel="manifest" href="/site.webmanifest"></link>
        <link rel="alternate" href="https://www.q62.xyz/en-US" hrefLang='en-US'></link>
        <link rel="alternate" href="https://www.q62.xyz/ru" hrefLang='ru'></link>
        <link rel="alternate" href="https://www.q62.xyz/en-US" hrefLang='x-default'></link>
        <script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
      </Head>
      <Catalog {...props} currentLocale={locale} searchString={search}
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
  creationTime: number;
  category: "TV_SHOW" | "MOVIE";
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!);
  const searchString = context.query.search as (string | undefined);
  const algoliaSearchResponse = await algoliaIndex.search<AlgoliaQueryItem>(searchString == null ? '' : searchString,
    {hitsPerPage: 1000});
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  return { props: {
    movies: algoliaSearchResponse.hits.sort((a, b) => {
      if (a.releaseYear !== b.releaseYear) {
        return b.releaseYear - a.releaseYear;
      }
      return b.creationTime - a.creationTime;
  }).map(_ => ({
      id: _.objectID,
      originalTitle: _.originalTitle,
      titleL8ns: _.titleL8ns,
      releaseYear: _.releaseYear,
      posterImagesPortrait: _.posterImagesPortrait,
      category: _.category})),
      currentLocale: langCode, 
      searchString: searchString
    }
  }
}
