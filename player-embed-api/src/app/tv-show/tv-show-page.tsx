'use client'
import Player from '../../../components/Player/Player';

export interface Release {
  id: string;
  audioLangs: string[]; 
}

export interface Episode {
  episodeNumber: number;
  nameL8ns: { [key: string]: string };
  releases: { [key: string]: Release };
  stillImge: string;
  defaultReleaseId: string;
}

export interface Season {
  nameL8ns: { [key: string]: string };
  seasonNumber: number;
  episodes: Episode[];
}

interface TvShowPageProps {
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  seasonNumber: number;
  episodeNumber: number;
  player: {
    backdropImage: string;
    mpdFile: string;
    m3u8File: string;
    thumbnailsFile: string;
  }
}

export default function TvShowPage(props: TvShowPageProps) {
  const playerTitle = `${props.titleL8ns['EN_US']} (${props.releaseYear}) • S${props.seasonNumber} • E${props.episodeNumber}`;
  return (
    <Player movieTitle={playerTitle}
      m3u8File={props.player.m3u8File}
      backdropImage={props.player.backdropImage}
      thumbnailsFile={props.player.thumbnailsFile}/>
  );
}
