import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

function Player(props: {movieTitle: string, m3u8File: string, thumbnailsFile?: string, backdropImage: string}) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  return (
	<MediaPlayer title={`${props.movieTitle}`} src={`${props.m3u8File}`}>
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={`${props.thumbnailsFile}`}/>
      <Poster className="vds-poster" src={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`} />
    </MediaPlayer>
  ); 
}

export default Player;