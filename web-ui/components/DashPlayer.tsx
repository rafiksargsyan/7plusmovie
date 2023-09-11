import { useEffect, useRef } from "react";
//import videojs from 'video.js';
import Plyr from 'plyr';
import dashjs from 'dashjs';
//import '../node_modules/video.js/dist/video-js.css';
//import '../node_modules/videojs-contrib-dash/dist/videojs-dash.min.js';
import '../node_modules/plyr/dist/plyr.css';

interface DashPlayerProps {
  mpdFile: string,
  thumbnailsFile?: string;
  poster: string,
  isLandscape: boolean;
}

function DashPlayer(props: DashPlayerProps) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement == null) return;
    const dash = dashjs.MediaPlayer().create();
    dash.initialize(videoElement, props.mpdFile, false);
    const player = new Plyr(videoElement, {
      captions: {active: true, update: true},
      previewThumbnails: {enabled: true, src: props.thumbnailsFile}
    });
    
    return () => {
      player.destroy();
      dash.reset();
    };
  }, []);
 
  return (
     <div>
        <video ref={videoRef}
               id="player" controls
               style={{objectFit: 'contain'}}
               data-poster={`${props.poster}`}
        />
     </div>  
  )
}

export default DashPlayer;
