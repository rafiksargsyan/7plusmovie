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
    const player = videojs(videoElement, {
        fill: true,
        controlBar: {
          skipButtons: {
            forward: 10,
            backward: 5
          }
        }});
    player.src({ src: props.mpdFile, type: 'application/dash+xml'});
    
    return () => {
      player.dispose();
    };
  }, []);
 
  return (
    <>
      <div data-js-player style={{height: '100vh', width: '100vw'}}>
        <video ref={videoRef}
               style={{objectFit: props.isLandscape ? 'fill' : 'contain'}}
               className="video-js vjs-default-skin" controls
               data-setup={`{"poster":"${props.poster}"}`}
        />
      </div>
    </>
  )
}

export default DashPlayer;
