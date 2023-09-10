import algoliasearch from 'algoliasearch';
import { GetServerSidePropsContext } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import TvShowSeriesList from '../components/TvShowSeriesList';

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

const L8nLangCodes = {
  EN_US : { langTag : "en-US", countryCode: "US" },
  RU : { langTag : "ru", countryCode: "RU" }
} as const;
  
const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

interface Episode {
  episodeNumber: number;
  originalName: string;
  nameL8ns: {[key: string]: string};
  stillImage: string;
}

interface Season {
  originalName: string;
  seasonNumber: number;
  nameL8ns: {[key: string]: string};
  episodes: Episode[];
}

interface TvShowPageProps {
  id: string;
  originalTitle: string;
  titleL8ns: {[key: string]: string};
  releaseYear: number;
  seasons: Season[];
  currentLocale: keyof typeof L8nLangCodes;
  posterImagesPortrait: {[key: string]: string};
}

function TvShowPage(props: TvShowPageProps) {
  const router = useRouter();
  const [locale, setLocale] = useState(props.currentLocale);

  const onLocaleChange = (locale: string) => {
    router.replace(router.asPath, undefined, { locale: L8nLangCodes[locale as keyof typeof L8nLangCodes].langTag });
    setLocale(locale as keyof typeof L8nLangCodes);
  }

  return (
    <>
      <Head>
        <title>{`${props.titleL8ns[props.currentLocale]} (${props.releaseYear})`}</title>
        <meta property="og:image" content={`${imageBaseUrl}h_720/${props.posterImagesPortrait[props.currentLocale]}`} />
        <meta property="og:title" content={`${props.titleL8ns[props.currentLocale]} (${props.releaseYear})`} />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png"></link>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png"></link>
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png"></link>
        <link rel="manifest" href="/site.webmanifest"></link>
        <link rel="alternate" href="https://www.q62.xyz/en-US" hrefLang='en-US'></link>
        <link rel="alternate" href="https://www.q62.xyz/ru" hrefLang='ru'></link>
        <link rel="alternate" href="https://www.q62.xyz/en-US" hrefLang='x-default'></link>
      </Head>
      <TvShowSeriesList {...props} onLocaleChange={onLocaleChange}/>
    </>
  )  
}

export default TvShowPage;

interface AlgoliaQueryItem {
  objectID: string;
  originalTitle: string;
  releaseYear: number;
  titleL8ns: { [key: string]: string};
  seasons: Season[];
  posterImagesPortrait: { [key: string]: string };
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!);
  const tvShowId = context.query.id as string;
  const algoliaSearchResponse = await algoliaIndex.getObject<AlgoliaQueryItem>(tvShowId);
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  const seasons = algoliaSearchResponse.seasons.map(s => ({...s,
    episodes: s.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)})).sort((a, b) => a.seasonNumber - b.seasonNumber);

  return {
    props: {
      id: algoliaSearchResponse.objectID,
      originalTitle: algoliaSearchResponse.originalTitle,
      titleL8ns: algoliaSearchResponse.titleL8ns,
      releaseYear: algoliaSearchResponse.releaseYear,
      posterImagesPortrait: algoliaSearchResponse.posterImagesPortrait,
      currentLocale: langCode,
      seasons: seasons
    }
  }
}
