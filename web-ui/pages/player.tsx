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
  thumbnailsFile: string;
}

interface TvShow {
  id: string;
  season: number;
  episode: number;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  backdropImage: string;
  seasonOriginalName: string;
  episodeOriginalName: string;
  seasonNameL8ns: { [key: string]: string };
  episodeNameL8ns: { [key: string]: string };
  mpdFile: string;
  m3u8File: string;
  subtitles: { [key: string]: string };
  thumbnailsFile: string;
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
    subtitles: response.data.subtitles,
    thumbnailsFile: response.data.thumbnailsFile
  }
}

async function getTvShow(id: string, season: number, episode: number): Promise<TvShow> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getTvShowMetadataForPlayer/${id}/${season}/${episode}`);
  return {
    id: id,
    season: season,
    episode: episode,
    originalTitle: response.data.originalTitle,
    titleL8ns: response.data.titleL8ns,
    releaseYear: response.data.releaseYear,
    backdropImage: response.data.stillImage,
    seasonOriginalName: response.data.seasonOriginalName,
    seasonNameL8ns: response.data.seasonNameL8ns,
    episodeOriginalName: response.data.episodeOriginalName,
    episodeNameL8ns: response.data.episodeNameL8ns,
    mpdFile: response.data.mpdFile,
    m3u8File: response.data.m3u8File,
    subtitles: response.data.subtitles,
    thumbnailsFile: response.data.thumbnailsFile
  }
}

const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

function PlayerPage(props : {movie: Movie | TvShow, currentLocaleCode: string, currentLocale: string, isMovie: boolean}) {
  let title = props.movie == undefined ? '' : `${props.movie.titleL8ns[props.currentLocaleCode] != undefined ? props.movie.titleL8ns[props.currentLocaleCode] : props.movie.originalTitle} (${props.movie.releaseYear})`;
  if (props.movie != undefined && !props.isMovie) {
    const tvShow = props.movie as TvShow;
    const seasonName = tvShow.seasonNameL8ns[props.currentLocaleCode] != undefined ? tvShow.seasonNameL8ns[props.currentLocaleCode] : tvShow.seasonOriginalName;
    const episodeName = tvShow.episodeNameL8ns[props.currentLocaleCode] != undefined ? tvShow.episodeNameL8ns[props.currentLocaleCode] : tvShow.episodeOriginalName;
    title += ` (${seasonName}) (${episodeName})`;
  }
  const alternateQuery = props.movie == undefined  ? '' : (props.isMovie ? `?movieId=${props.movie.id}` : `?tvShowId=${props.movie.id}&season=${(props.movie as TvShow).season}&episode=${(props.movie as TvShow).episode}`);
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta property="og:title" content={title} />
        <meta property="og:image" content={props.movie == undefined ? undefined : `${imageBaseUrl}h_720/${props.movie.backdropImage}`}/>
        <link rel="alternate" href={`https://www.q62.xyz/en-US/player?movieId=${alternateQuery}`} hrefLang='en-US'></link>
        <link rel="alternate" href={`https://www.q62.xyz/ru/player?movieId=${alternateQuery}`} hrefLang='ru'></link>
        <link rel="alternate" href={`https://www.q62.xyz/en-US/player?movieId=${alternateQuery}`} hrefLang='x-default'></link>
      </Head>
      <ThemeProvider theme={darkTheme}>
	      <CssBaseline />
        <Player mpdFile={props.movie.mpdFile} m3u8File={props.movie.m3u8File} thumbnailsFile={props.movie.thumbnailsFile} backdropImage={props.movie.backdropImage}
                subtitles={props.movie.subtitles} playerLocale={props.currentLocale} movieTitle={title} localeCode={props.currentLocaleCode}/>
      </ThemeProvider>
    </>
  )
}

export default PlayerPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const movieId = context.query.movieId;
  const tvShowId = context.query.tvShowId;
  const episode = context.query.episode;
  const season = context.query.season;
  const movie = movieId != undefined ? await getMovie(movieId as string) : undefined;
  const tvShow = tvShowId != undefined ? await getTvShow(tvShowId as string, Number(season as string), Number(episode as string)) : undefined;
  
  const locale = (context.locale != null ? context.locale : context.defaultLocale!) as keyof typeof langTagToLangCode;
  const langCode = langTagToLangCode[locale];
  return { props: {
      movie: movie != undefined ? movie : tvShow,
      currentLocaleCode: langCode,
      currentLocale: locale,
      isMovie: movie != undefined
    }
  }
}
