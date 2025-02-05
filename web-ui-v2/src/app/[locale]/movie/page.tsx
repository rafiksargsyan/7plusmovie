import axios from 'axios'; 
import requestIp from 'request-ip';
import { headers } from 'next/headers';
import MoviePage, { MovieRelease } from './movie-page';

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
 
export default async function Page({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const movieId = (await searchParams).id as string;
  const headersList = await headers();
  const clientIp = requestIp.getClientIp({ headers: headersList });
  const preferredAudioLang = await ip2AudioLang(clientIp)
  const movieReleases = await getMovieReleases(movieId, preferredAudioLang);
  return <MoviePage {...movieReleases} />
}
