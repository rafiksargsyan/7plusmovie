import axios from 'axios'; 
import requestIp from 'request-ip';
import { headers } from 'next/headers';
import MoviePage, { MovieRelease, MovieStreamInfo } from './movie-page';
import { Nullable } from '@/types/Nullable';

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
