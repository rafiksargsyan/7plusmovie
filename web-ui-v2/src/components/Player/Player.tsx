import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { useEffect, useRef } from 'react';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

function Player(props: {movieTitle: string, m3u8File: string, thumbnailsFile?: string, backdropImage: string}) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const playerRef = useRef(null);

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      (player as any).textTracks.clear();
    }
  }, [props.m3u8File]);

  return (
	<MediaPlayer ref={playerRef} title={`${props.movieTitle}`} src={`${props.m3u8File}`} preferNativeHLS={isSafari}>
      <MediaProvider />
      <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={`${props.thumbnailsFile}`}/>
      <Poster className="vds-poster" src={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`} />
    </MediaPlayer>
  ); 
}

export default Player;