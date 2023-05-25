import { useEffect, useRef } from "react";
import videojs from 'video.js';
import '../node_modules/video.js/dist/video-js.css';
import '../node_modules/videojs-contrib-dash/dist/videojs-dash.min.js';

interface DashPlayerProps {
  mpdFile: string,
  poster: string,
  isLandscape: boolean;
}

function DashPlayer(props: DashPlayerProps) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement == null) return;
    const player = videojs(videoElement);
    player.fill(true);
    player.src({ src: props.mpdFile, type: 'application/dash+xml'});
    
    return () => {
      player.dispose();
    };
  }, []);
 
  return (
    <>
      <div data-js-player style={{width: '100vw', height: '100vh'}}>
        <video ref={videoRef}
               style={{objectFit: props.isLandscape ? 'fill' : 'contain', }}
               className="video-js vjs-default-skin" controls
               poster={props.poster}
        />
      </div>
    </>
  )
}

export default DashPlayer;
