import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { red } from '@mui/material/colors';
import axios from 'axios';
import { GetServerSidePropsContext } from 'next';
import dynamic from 'next/dynamic';
import Head from 'next/head';

const Player = dynamic(() => import ("../components/Player"), {ssr: false});

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	  primary: {
		main: red[600],
	  }
  },
});

interface Movie {
  id: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  backdropImage: string;
  mpdFile: string;
  m3u8File: string;
  subtitles: { [key: string]: string };
}

async function getMovie(movieId: string): Promise<Movie> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}`);
  return {
    id: movieId,
    originalTitle: response.data.originalTitle,
    titleL8ns: response.data.titleL8ns,
    releaseYear: response.data.releaseYear,
    backdropImage: response.data.backdropImage,
    mpdFile: response.data.mpdFile,
    m3u8File: response.data.m3u8File,
    subtitles: response.data.subtitles
  }
}

const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

function PlayerPage(props : {movie: Movie, currentLocaleCode: string, currentLocale: string}) {
  const movieTitle = props.movie == undefined ? '' : `${props.movie.titleL8ns[props.currentLocaleCode] != undefined ? props.movie.titleL8ns[props.currentLocaleCode] : props.movie.originalTitle} (${props.movie.releaseYear})`;
  const movieId = props.movie == undefined ? '' : props.movie.id;
  return (
    <>
      <Head>
        <title>{movieTitle}</title>
        <meta property="og:title" content={movieTitle} />
        <meta property="og:image" content={props.movie == undefined ? undefined : `${imageBaseUrl}h_720/${props.movie.backdropImage}`}/>
        <link rel="alternate" href={`https://www.q62.xyz/en-US/player?movieId=${movieId}`} hrefLang='en-US'></link>
        <link rel="alternate" href={`https://www.q62.xyz/ru/player?movieId=${movieId}`} hrefLang='ru'></link>
        <link rel="alternate" href={`https://www.q62.xyz/en-US/player?movieId=${movieId}`} hrefLang='x-default'></link>
      </Head>
      <ThemeProvider theme={darkTheme}>
	      <CssBaseline />
        <Player mpdFile={props.movie.mpdFile} m3u8File={props.movie.m3u8File} backdropImage={props.movie.backdropImage}
                subtitles={props.movie.subtitles} playerLocale={props.currentLocale} movieTitle={movieTitle} localeCode={props.currentLocaleCode}/>
      </ThemeProvider>
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
      currentLocaleCode: langCode,
      currentLocale: locale
    }
  }
}
