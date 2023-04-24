import axios from 'axios';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const Player = dynamic(import ("../components/Player"), { ssr: false });

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

function PlayerPage() {
  const [movie, setMovie] = useState<Movie>();
  const router = useRouter();
  const paramString = router.asPath.split("?")[1];
	const movieId = new URLSearchParams(paramString).get('movieId')!;
  const currentLocale = router.locale != null ? router.locale : router.defaultLocale!;
  const currentLocaleCode = langTagToLangCode[currentLocale as keyof typeof langTagToLangCode];
  
  useEffect(() => {
    getMovie(movieId).then(m => {
      setMovie(m);
    });
  }, [movieId]);

  return (
    <>
      <Head>
        <title>{movie == undefined ? '' : `${movie.titleL8ns[currentLocaleCode] != undefined ? movie.titleL8ns[currentLocaleCode] : movie.originalTitle} (${movie.releaseYear})`}</title>
      </Head>
      {movie != undefined && <Player mpdFile={movie.mpdFile} cloudFrontSignedUrlParams={movie.cloudFrontSignedUrlParams}
                                     backdropImage={movie.backdropImage} subtitles={movie.subtitles}/>}
    </>
  )
}

export default PlayerPage;
