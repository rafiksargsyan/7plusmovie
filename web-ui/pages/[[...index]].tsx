import algoliasearch from 'algoliasearch';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import Catalog from '../components/Catalog';
import querystring from 'querystring';

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
  page: number
  maxPage: number
}

function CatalogPage(props: CatalogPageProps) {
  const router = useRouter();
  const [locale, setLocale] = useState(props.currentLocale);
  const [search, setSearch] = useState(props.searchString);
  const [items, setItems] = useState<any>(props.movies);
  const [page, setPage] = useState(props.page + 1);
  const [isLoading, setIsLoading] = useState(false)
  const onScroll = useCallback(async () => {
    var { scrollTop, clientHeight, scrollHeight } = document.documentElement
    if (scrollHeight - scrollTop - clientHeight <= 1 && !isLoading) {
      setPage(currentPage => {
        if (currentPage >= props.maxPage) {
          return currentPage
        }
        return currentPage + 1
      });
    }
  }, [isLoading]);

  const onSearchChange = (searchString: string | null) => {
    router.replace({ pathname: router.basePath, query: {search: searchString}}, undefined, { shallow: true});
    setSearch(searchString != null ? searchString : '');
    setPage(1)
  };
  
  const onLocaleChange = (locale: string) => {
    router.replace(router.asPath, undefined, { locale: L8nLangCodes[locale as keyof typeof L8nLangCodes].langTag, shallow: true });
    setLocale(locale as keyof typeof L8nLangCodes);
  }

  useEffect(() => {
    kofiWidgetOverlay.draw('q62xyz', {
      'type': 'floating-chat',
      'floating-chat.donateButton.text': 'Support Us',
      'floating-chat.donateButton.background-color': '#00b9fe',
      'floating-chat.donateButton.text-color': '#fff'
    })
  }, [])

  useEffect(() => {
    const throttledOnScroll = throttle(onScroll, 10)
    document.addEventListener("scroll", throttledOnScroll)
    return () => {
      document.removeEventListener("scroll", throttledOnScroll);
    }; 
  }, [onScroll])

  useEffect(() => {
    const loadMoreData = async () => {
      setIsLoading(true)
      const pageResult = await getPage(search, page, 70)
      await new Promise(r => setTimeout(r, 500));
      if (page === 1) {
        setItems(pageResult.pageData)
      } else {
        setItems((currentItems: any) => [...currentItems, ...pageResult.pageData])
      }
      setIsLoading(false)
    }
    loadMoreData()
  }, [page, search])

  let path = `/${router.locale}${router.asPath}`
  path = path.substring(0, path.lastIndexOf('/') + 1)
  const urlSearchParams = new URLSearchParams(querystring.stringify(router.query))
  urlSearchParams.set('page', `${props.page+1}`)
  const next = `${path}?${urlSearchParams.toString()}`
  urlSearchParams.set('page', `${props.page-1}`)
  const prev = `${path}?${urlSearchParams.toString()}`

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
        { props.page < props.maxPage && <link rel="next" href={next}/> }
        { props.page > 0 && <link rel="prev" href={prev}/> }
        <script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
      </Head>
      <Catalog {...props} movies={items} currentLocale={locale} searchString={search}
        onSearchChange={onSearchChange} onLocaleChange={onLocaleChange}/>
      {isLoading && <h1 style={{textAlign: 'center', margin: '0 auto', display: 'block'}}>loading...</h1>}
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
  const searchString = context.query.search as (string | undefined);
  let page = null;
  if (context.query.page != undefined) {
    page = Number.parseInt(context.query.page as string)
  }
  if (page == null || isNaN(page)) page = 1;
  const pageResult = await getPage(searchString == undefined ? '' : searchString, page, 70)
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  return { props: {
      maxPage: pageResult.maxPage,
      page: page,
      movies: pageResult.pageData,
      currentLocale: langCode, 
      searchString: searchString
    }
  }
}

async function getPage(searchStr: string, page: number, pageSize: number) {
  const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!)
  const algoliaIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!);  
  const algoliaSearchResponse = await algoliaIndex.search<AlgoliaQueryItem>(searchStr, {hitsPerPage: 1000})
  const items = algoliaSearchResponse.hits.sort((a, b) => {
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
    category: _.category}))
  return {
    pageData: items.slice((page - 1) * pageSize, page * pageSize),
    maxPage: Math.ceil(items.length / pageSize),
    page: page
  }
}

const throttle = (fn: any, delay: any) => { 
  // Capture the current time 
  let time = Date.now(); 
 
  // Here's our logic 
  return () => { 
    if((time + delay - Date.now()) <= 0) { 
      // Run the function we've passed to our throttler, 
      // and reset the `time` variable (so we can check again). 
      fn(); 
      time = Date.now(); 
    } 
  } 
}
