import dashjs from "dashjs";
import { useEffect, useRef } from "react";
import ControlBar from "./contrib-akamai-controlbar/ControlBar";

interface DashPlayerProps {
  mpdFile: string,
  poster: string,
  isLandscape: boolean;
}

function DashPlayer(props: DashPlayerProps) {
  const videoRef = useRef(null);

  useEffect(() => {
    const player = dashjs.MediaPlayer().create();
    player.initialize(videoRef.current == null ? undefined : videoRef.current, props.mpdFile, false);
  
    const controlbar: any = new ControlBar(player);
    controlbar.initialize();
    
    return () => {
      player.reset();
    };
  }, []);
 
  return (
    <div className="videoContainer" id="videoContainer" style={{width: '100vw', height: '100vh'}}>
       <video ref={videoRef} width="100%" height="100%"
          style={{objectFit: props.isLandscape ? 'fill' : 'contain', maxHeight: '100vh', position: 'absolute'}}
          controls={false} poster={props.poster}
        />
        <div id="videoController" className="video-controller unselectable">
            <div id="playPauseBtn" className="btn-play-pause" title="Play/Pause">
                <span id="iconPlayPause" className="icon-play"></span>
            </div>
            <span id="videoTime" className="time-display">00:00:00</span>
            <div id="fullscreenBtn" className="btn-fullscreen control-icon-layout" title="Fullscreen">
                <span className="icon-fullscreen-enter"></span>
            </div>
            <div id="bitrateListBtn" className="control-icon-layout" title="Bitrate List">
                <span className="icon-bitrate"></span>
            </div>
            <input type="range" id="volumebar" className="volumebar" value="1" min="0" max="1" step=".01"/>
            <div id="muteBtn" className="btn-mute control-icon-layout" title="Mute">
                <span id="iconMute" className="icon-mute-off"></span>
            </div>
            <div id="trackSwitchBtn" className="control-icon-layout" title="A/V Tracks">
                <span className="icon-tracks"></span>
            </div>
            <div id="captionBtn" className="btn-caption control-icon-layout" title="Closed Caption">
                <span className="icon-caption"></span>
            </div>
            <span id="videoDuration" className="duration-display">00:00:00</span>
            <div className="seekContainer">
                <div id="seekbar" className="seekbar seekbar-complete">
                    <div id="seekbar-buffer" className="seekbar seekbar-buffer"></div>
                    <div id="seekbar-play" className="seekbar seekbar-play"></div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default DashPlayer;
