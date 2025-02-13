import axios from 'axios'; 
import requestIp from 'request-ip';
import { headers } from 'next/headers';
import { Nullable } from '@/types/Nullable';
import TvShowPage, { Release, Season } from './tv-show-page';

async function ip2AudioLang(ip: string | null): Promise<string> {
  if (ip == null) ip = '0.0.0.0';
  const response = await axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/ip-2-audio-lang/${ip}`);
  return response.data;
}

export async function getTvShowReleases(id: string, preferredAudioLang: string) {
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

export function getDefaultReleaseId(seasons: Season[], season: number, episode: number) {
  return seasons.filter((s) => s.seasonNumber === season)[0].episodes.filter((e) => e.episodeNumber === episode)[0].defaultReleaseId;
}

export async function getPlayerData(id: string, seasonNumber: number, episodeNumber: number, releaseId: Nullable<string>, preferredAudioLang: string): Promise<MovieStreamInfo> {
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
  const clientIp = requestIp.getClientIp({ headers: headersList });
  const preferredAudioLang = await ip2AudioLang(clientIp)
  const tvShowReleases = await getTvShowReleases(id, preferredAudioLang);
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
