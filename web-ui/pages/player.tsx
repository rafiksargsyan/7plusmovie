import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Player = dynamic(() => import ("../components/Player"), {ssr: false});

interface Movie {
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  backdropImage: string;
  cloudFrontSignedUrlParams: string;
  mpdFile: string;
  subtitles: { [key: string]: string };
}

async function getMovie(movieId: string): Promise<Movie> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}`);
  return {
    originalTitle: response.data.originalTitle,
    titleL8ns: response.data.titleL8ns,
    releaseYear: response.data.releaseYear,
    backdropImage: response.data.backdropImage,
    cloudFrontSignedUrlParams: response.data.cloudFrontSignedUrlParams,
    mpdFile: response.data.mpdFile,
    subtitles: response.data.subtitles
  }
}

const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

function PlayerPage(props : {movie: Movie, currentLocale: string}) {
  return (
    <>
      <Head>
        <title>{props.movie == undefined ? '' : `${props.movie.titleL8ns[props.currentLocale] != undefined ? props.movie.titleL8ns[props.currentLocale] : props.movie.originalTitle} (${props.movie.releaseYear})`}</title>
        <link rel="alternate" href="/en-US" hrefLang='en-US'></link>
        <link rel="alternate" href="/ru" hrefLang='ru'></link>
        <link rel="alternate" href="/en-US" hrefLang='x-default'></link>
      </Head>
      <Player mpdFile={props.movie.mpdFile} cloudFrontSignedUrlParams={props.movie.cloudFrontSignedUrlParams}
              backdropImage={props.movie.backdropImage} subtitles={props.movie.subtitles}/>
    </>
  )
}

export default PlayerPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const movieId = context.query.movieId;
  const movie = await getMovie(movieId as string);
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  return { props: {
    movie: movie,
    currentLocale: langCode
    }
  }
}
