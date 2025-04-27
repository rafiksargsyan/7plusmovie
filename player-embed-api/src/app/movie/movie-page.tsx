'use client'
import Script from 'next/script';
import Player from '../../../components/Player/Player';

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
    <>
      <Script id='monetag'>{`(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),
                    'https://paupsoborofoow.net/tag.min.js',9188321,document.body||document.documentElement)`}</Script>
      <Player movieTitle={`${props.titleL8ns['EN_US']} (${props.releaseYear})`}
        m3u8File={props.m3u8File}
        backdropImage={props.backdropImage}
        thumbnailsFile={props.thumbnailsFile}/>
    </>
  );
}
