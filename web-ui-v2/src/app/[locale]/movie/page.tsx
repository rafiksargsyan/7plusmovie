import axios from 'axios'; 
import requestIp from 'request-ip';
import { headers } from 'next/headers';
import MoviePage, { MovieRelease, MovieStreamInfo } from './movie-page';
import { Nullable } from '@/types/Nullable';
import { Metadata, ResolvingMetadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n/routing';

async function ip2AudioLang(ip: string | null): Promise<string> {
  if (ip == null) ip = '0.0.0.0';
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/ip-2-audio-lang/${ip}`);
  return response.data;
}

export async function getMovieReleases(movieId: string, preferredAudioLang: string) {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/movie/${movieId}/releases?preferredAudioLang=${preferredAudioLang}`);
  const data = response.data;
  return {
    defaultReleaseId : data.defaultReleaseId,
    releases: Object.values(data.releases).reduce((a: { [id:string]: MovieRelease }, c: any) => {
      a[c['id']] = {
        id: c['id'],
        quality: (c['ripType'] === 'CAM' || c['ripType'] === 'TELESYNC' ? c['ripType'] : c.resolution),
        audioLangs: c['audioLangs']     
      };
      return a;
    }, {})
  }
}

export async function getMovieStreamInfo(movieId: string, releaseId: Nullable<string>, preferredAudioLang: string): Promise<MovieStreamInfo> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}?preferredAudioLang=${preferredAudioLang}&releaseId=${releaseId}`);
  return {
    id: movieId,
    releaesId: releaseId,
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
    { params, searchParams}: Props,
    parent: ResolvingMetadata
  ): Promise<Metadata> {
    const locale = (await params).locale;
    const t = await getTranslations({locale, namespace: 'Metadata'});
    const id = (await searchParams).id as string;
    const movie = await getMovieStreamInfo(id, null, 'EN_US');
    const localeKey = Locale.FROM_LANG_TAG[locale].key;
    const title = `${(localeKey in movie.titleL8ns) ? movie.titleL8ns[localeKey] : movie.titleL8ns['EN_US']} (${movie.releaseYear})`;

    return {
      title: title,
      description: t('movie.description', {title: title}),
      openGraph: {
        title: title,
        description: t('movie.description', {title: title}),
        images: '/ogImage.jpg',
      },
      alternates: {
        canonical: '/',
        languages: Object.keys(Locale.FROM_LANG_TAG).reduce((a: {[key:string]: string}, c) => { a[c] = `/${c}/movie?id=${id}`; return a; }, {})
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
  const releaseId = (await searchParams).releaseId as string;
  const headersList = await headers();
  const clientIp = requestIp.getClientIp({ headers: headersList });
  const preferredAudioLang = await ip2AudioLang(clientIp)
  const movieReleases = await getMovieReleases(movieId, preferredAudioLang);
  if (releaseId != null) movieReleases.defaultReleaseId = releaseId;
  const movieStreamInfo = await getMovieStreamInfo(movieId, movieReleases.defaultReleaseId, preferredAudioLang);
  return <MoviePage {...movieReleases} movieStreamInfo={movieStreamInfo} />
}
