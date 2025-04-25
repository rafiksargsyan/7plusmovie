import axios from 'axios'; 
import TvShowPage from './tv-show-page';
import { Metadata } from 'next';
import { Nullable } from '../../../types/Nullable';

async function findTvShowByExternalId(tmdbId: Nullable<string>, imdbId: Nullable<string>, tvdbId: Nullable<string>) {
  if (tmdbId == null) tmdbId = '';
  if (imdbId == null) imdbId = '';
  if (tvdbId == null) tvdbId = '';
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod//tv-show/find/external-ids?imdbId=${imdbId}&tmdbId=${tmdbId}&tvdbId${tvdbId}`);
  return response.data;
}

async function getPlayerData(id: string, seasonNumber: number, episodeNumber: number, preferredAudioLang: string): Promise<any> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getTvShowMetadataForPlayer/${id}/${seasonNumber}/${episodeNumber}?preferredAudioLang=${preferredAudioLang}`);
  return {
    originalTitle: response.data.originalTitle,
    titleL8ns: response.data.titleL8ns,
    releaseYear: response.data.releaseYear,
    backdropImage: response.data.stillImage,
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
    { searchParams}: Props): Promise<Metadata> {
  const id = (await searchParams).id as string;
  const tv = await getPlayerData(id, 1, 1, 'EN_US');
  const title = `${tv.titleL8ns['EN_US']} (${tv.releaseYear})`;
  return {
    title: title,
    description: title,
    openGraph: {
      title: title,
      description: title
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
  const tvdbId = (await searchParams).tvdbId as Nullable<string>;
  const id = await findTvShowByExternalId(tmdbId, imdbId, tvdbId); // TODO: Handle null id case
  const seasonStr = (await searchParams).s as string;
  const season = seasonStr == null ? 1 : Number.parseInt(seasonStr);
  const episodeStr = (await searchParams).e as string;
  const episode = episodeStr == null ? 1 : Number.parseInt(episodeStr)
  const preferredAudioLang = (await searchParams).preferredAudioLang as Nullable<string>;
  const playerData = await getPlayerData(id, season, episode, preferredAudioLang != null ? preferredAudioLang.replace('-', '_').toUpperCase() : 'EN_US');
  return <TvShowPage
      titleL8ns={playerData.titleL8ns}
      releaseYear={playerData.releaseYear}
      seasonNumber={season}
      episodeNumber={episode}
      player={{
        backdropImage: playerData.backdropImage,
        mpdFile: playerData.mpdFile,
        m3u8File: playerData.m3u8File,
        thumbnailsFile: playerData.thumbnailsFile}}/>
}
