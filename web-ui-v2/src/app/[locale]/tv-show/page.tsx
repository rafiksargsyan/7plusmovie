import axios from 'axios'; 
import requestIp, { RequestHeaders } from 'request-ip';
import { headers } from 'next/headers';
import { Nullable } from '@/types/Nullable';
import TvShowPage, {  Season } from './tv-show-page';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/i18n/routing';
import { getOrUpdateCache } from '../page';
import { getTvShowById } from '@/service/SearchService';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

async function ip2AudioLang(ip: string | null): Promise<string> {
  if (ip == null) ip = '0.0.0.0';
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/ip-2-audio-lang/${ip}`);
  return response.data;
}

async function getTvShowReleasesCached(id: string, preferredAudioLang: string) {
  return getOrUpdateCache(() => getTvShowReleases(id, preferredAudioLang), `tvShowReleases_${id}_${preferredAudioLang}`, 3600);
}

async function getTvShowReleases(id: string, preferredAudioLang: string) {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/tv-show/${id}/releases?preferredAudioLang=${preferredAudioLang}`);
  const data = response.data;
  const seasons: Season[] = [];
  for (const s of data.seasons) {
    const season: Season = {
      nameL8ns: s.nameL8ns,
      seasonNumber: s.seasonNumber,
      episodes: []
    }
    seasons.push(season);
    for (const e of s.episodes) {
      season.episodes.push({
        episodeNumber: e.episodeNumber,
        nameL8ns: e.nameL8ns,
        releases: e.releases,
        stillImge: e.stillImage,
        defaultReleaseId: e.defaultReleaseId
      })
    }
  }
  return seasons;
}

function getDefaultReleaseId(seasons: Season[], season: number, episode: number) {
  return seasons.filter((s) => s.seasonNumber === season)[0].episodes.filter((e) => e.episodeNumber === episode)[0].defaultReleaseId;
}

async function getPlayerData(id: string, seasonNumber: number, episodeNumber: number, releaseId: Nullable<string>, preferredAudioLang: string): Promise<any> {
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getTvShowMetadataForPlayer/${id}/${seasonNumber}/${episodeNumber}?preferredAudioLang=${preferredAudioLang}&releaseId=${releaseId}`);
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
    { params, searchParams}: Props
  ): Promise<Metadata> {
    const locale = (await params).locale;
    const t = await getTranslations({locale, namespace: 'Metadata'});
    const id = (await searchParams).id as string;
    const tv = await getPlayerData(id, 1, 1, null, 'EN_US');
    const localeKey = Locale.FROM_LANG_TAG[locale].key;
    const title = `${(localeKey in tv.titleL8ns) ? tv.titleL8ns[localeKey] : tv.titleL8ns['EN_US']} (${tv.releaseYear})`;
    const algoliaTvShowObject = await getOrUpdateCache(() => {
      return getTvShowById(id);
    }, `algolia_${id}`, 3600 * 24);
    const posters: { [key:string]: string } = algoliaTvShowObject.posterImagesPortrait as { [key:string]: string };
    const poster = `${imageBaseUrl}h=720,f=auto/${(localeKey in posters) ? posters[localeKey] : posters['EN_US']}`;
    return {
      title: title,
      description: t('movie.description', {title: title}),
      openGraph: {
        title: title,
        description: t('movie.description', {title: title}),
        images: poster,
      },
      alternates: {
        canonical: '/',
        languages: Object.keys(Locale.FROM_LANG_TAG).reduce((a: {[key:string]: string}, c) => { a[c] = `/${c}/tv-show?id=${id}`; return a; }, {})
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
  const id = (await searchParams).id as string;
  const seasonStr = (await searchParams).s as string;
  const season = seasonStr == null ? 1 : Number.parseInt(seasonStr);
  const episodeStr = (await searchParams).e as string;
  const episode = episodeStr == null ? 1 : Number.parseInt(episodeStr)
  const releaseId = (await searchParams).releaseId as string;
  const headersList = await headers();
  const clientIp = requestIp.getClientIp({ headers: headersList as unknown as RequestHeaders });
  const preferredAudioLang = await ip2AudioLang(clientIp)
  const tvShowReleases = await getTvShowReleasesCached(id, preferredAudioLang);
  let currentReleaseId: Nullable<string> = releaseId;
  if (currentReleaseId == null) currentReleaseId = getDefaultReleaseId(tvShowReleases, season, episode);
  const playerData = await getPlayerData(id, season, episode, currentReleaseId, preferredAudioLang);
  return <TvShowPage
      titleL8ns={playerData.titleL8ns} releaseYear={playerData.releaseYear}
      currentSeasonNumber={season} currentEpisodeNumber={episode} currentReleaseId={currentReleaseId}
      seasons={tvShowReleases}
      player={{
        backdropImage: playerData.backdropImage,
        mpdFile: playerData.mpdFile,
        m3u8File: playerData.m3u8File,
        thumbnailsFile: playerData.thumbnailsFile
  }}  />
}
