import axios from 'axios'; 
import MoviePage, { MoviePageProps } from './movie-page';
import { Metadata } from 'next';
import { Nullable } from '../../../types/Nullable';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

async function findMovieByExternalId(tmdbId: Nullable<string>, imdbId: Nullable<string>) {
  if (tmdbId == null) tmdbId = '';
  if (imdbId == null) imdbId = '';
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod//movie/find/external-ids?imdbId=${imdbId}&tmdbId=${tmdbId}`);
  return response.data;
}

async function getMovieStreamInfo(movieId: string, preferredAudioLang: string): Promise<MoviePageProps> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}?preferredAudioLang=${preferredAudioLang}`);
  return {
    id: movieId,
    originalTitle: response.data.originalTitle,
    titleL8ns: response.data.titleL8ns,
    releaseYear: response.data.releaseYear,
    backdropImage: response.data.backdropImage,
    mpdFile: response.data.mpdFile,
    m3u8File: response.data.m3u8File,
    thumbnailsFile: response.data.thumbnailsFile
  }
}

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}
  
export async function generateMetadata(
  { searchParams}: Props
): Promise<Metadata> {
  const id = (await searchParams).id as string;
  const movie = await getMovieStreamInfo(id, 'EN_US');
  const title = `${movie.titleL8ns['EN_US']} (${movie.releaseYear})`;
  return {
    title: title,
    description: title,
    openGraph: {
      title: title,
      description: title,
      images: `${imageBaseUrl}h=720,f=auto/${movie.backdropImage}`,
    },
    icons: {
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ]
    },
    manifest: '/site.webmanifest'
  }
}

export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const tmdbId = (await searchParams).tmdbId as Nullable<string>;
  const imdbId = (await searchParams).imdbId as Nullable<string>;
  const movieId = await findMovieByExternalId(tmdbId, imdbId); // Handle null movieId case, show meaningfull message
  const preferredAudioLang = "TODO"; // get from search params
  const moviePageProps = await getMovieStreamInfo(movieId, preferredAudioLang);
  return <MoviePage {...moviePageProps} />
}
