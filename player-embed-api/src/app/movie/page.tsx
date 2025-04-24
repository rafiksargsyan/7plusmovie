import axios from 'axios'; 
import MoviePage, { MoviePageProps } from './movie-page';
import { Nullable } from '@/types/Nullable';
import { Metadata } from 'next';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

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
  { params, searchParams}: Props
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
  const movieId = (await searchParams).id as string;
  const preferredAudioLang = "TODO"; // get from search params
  const moviePageProps = await getMovieStreamInfo(movieId, preferredAudioLang);
  return <MoviePage {...moviePageProps} />
}
