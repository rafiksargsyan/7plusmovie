'use client'
import Player from '@/components/Player/Player';
import { Nullable } from '@/types/Nullable';

export interface MoviePageProps {
  id: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  backdropImage: string;
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: string;
}

export default function MoviePage(props: MoviePageProps) {
  return (
    <Player movieTitle={`${props.titleL8ns['EN_US']} (${props.releaseYear})`}
      m3u8File={props.m3u8File}
      backdropImage={props.backdropImage}
      thumbnailsFile={props.thumbnailsFile}/>
  );
}
