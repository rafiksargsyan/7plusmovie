import { useEffect, useRef, useState } from "react";
import Plyr from '@antik-web/plyr';
import dashjs from 'dashjs';
import '../node_modules/@antik-web/plyr/dist/plyr.css';

interface DashPlayerProps {
  mpdFile: string,
  thumbnailsFile?: string;
  poster: string,
}

function DashPlayer(props: DashPlayerProps) {
  const videoRef = useRef(null);
  const [audioTracks, setAudioTracks] = useState<{[key:string]:any}>({});
  const [player, setPlayer] = useState<Plyr>();

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement == undefined) return;
    const dash = dashjs.MediaPlayer().create();
    dash.initialize(videoElement, props.mpdFile, false);
    dash.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
      const dashAudioTracks = dash.getTracksFor('audio');
      const audioTracksTmp: {[key: string]: any} = {};
      dashAudioTracks.forEach(_ => {
        audioTracksTmp[(_.index as number).toString()] = _.labels[0].text
      })
      setAudioTracks(audioTracksTmp);
      const mainAudioTrack = dashAudioTracks.filter(_ => _?.roles?.filter(r => r === 'main')?.length === 1)[0];
      if (mainAudioTrack != undefined) {
        dash.setCurrentTrack(mainAudioTrack);
      }
      setPlayer(new Plyr(dash as any, {
        quality: {
          default: 'auto',
        },
        controls: ['play-large', 'play', 'progress', 'current-time', 'captions', 'settings', 'fullscreen', 'rewind'],
        settings: ['captions', 'speed', 'audioTrack'],
        captions: {active: true, update: true},
        previewThumbnails: {enabled: true, src: props.thumbnailsFile},
        audioTrack: {
          options: Object.keys(audioTracks),
          selected: mainAudioTrack?.index != undefined ? mainAudioTrack.index.toString() : dash.getCurrentTrackFor('audio')?.index?.toString(),
          onChange: (e: string) => dash.setCurrentTrack(dash.getTracksFor('audio')
          .filter(_ => _.index?.toString() === e)[0]),
        },
        i18n: {
          audioTrack: 'Language',
          audioTrackLabel: audioTracksTmp
        },
        seekTime: 5
      } as any));
    });

    return () => {
      player?.destroy();
      dash.reset();
    };
  }, []);
 
  return (
     <div>
        <video ref={videoRef}
               id="player"
               style={{objectFit: 'contain'}}
               data-poster={`${props.poster}`}
        />
     </div>  
  )
}

export default DashPlayer;
