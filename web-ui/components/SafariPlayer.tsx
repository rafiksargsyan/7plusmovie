import { useEffect, useRef, useState } from "react";
import Plyr from '@antik-web/plyr';
import '../node_modules/@antik-web/plyr/dist/plyr.css';

interface SafariPlayerProps {
  hlsFile: string;
  thumbnailsFile?: string;
  poster: string;
  localeCode: string;
  subtitles: {[key: string]: string};
}

function SafariPlayer(props: SafariPlayerProps) {
  const videoRef = useRef(null);
  const [player, setPlayer] = useState<Plyr>();

  useEffect(() => {
    const videoElement = videoRef.current;
    if (videoElement == undefined) return;
    (videoElement as any).addEventListener('loadeddata', () => {
      (videoElement as any).poster = props.poster;
      const audioTracks = (videoElement as any).audioTracks;
      console.log((videoElement as any).textTracks);
      let curAudioTrackId: string | undefined = undefined;
      let curAudioTrackIndex: number | undefined = undefined;
      for (let i = 0; i < audioTracks.length; ++i) {
        if (audioTracks[i].enabled) {
          curAudioTrackId = audioTracks[i].id;
          curAudioTrackIndex = i;
          break;
        }
      }
      let ruAudioTrackId: string | undefined = undefined;
      let ruAudioTrackIndex: number | undefined = undefined;
      for (let i = 0; i < audioTracks.length; ++i) {
        if (audioTracks[i].language === "ru-x-1" || audioTracks[i].language === "ru-x-2") {
          ruAudioTrackId = audioTracks[i].id;
          ruAudioTrackIndex = i;
          break;
        }
      }
      let enAudioTrackId: string | undefined = undefined;
      let enAudioTrackIndex: number | undefined = undefined;
      for (let i = 0; i < audioTracks.length; ++i) {
        if (audioTracks[i].language === "en-US-x-1" || audioTracks[i].language === "en-US-x-2" || 
            audioTracks[i].language === "en-GB-x-1" || audioTracks[i].language === "en-GB-x-2") {
          enAudioTrackId = audioTracks[i].id;
          enAudioTrackIndex = i;
          break;
        }
      }
      const selectedAudioTrackId = (props.localeCode  === 'EN_US' && enAudioTrackId != undefined) ? enAudioTrackId :
      (ruAudioTrackId != undefined ? ruAudioTrackId : (curAudioTrackId != undefined ? curAudioTrackId : 0));
      const selectedAudioTrackIndex = (props.localeCode  === 'EN_US' && enAudioTrackIndex != undefined) ? enAudioTrackIndex :
      (ruAudioTrackIndex != undefined ? ruAudioTrackIndex : (curAudioTrackIndex != undefined ? curAudioTrackIndex : 0));
      for (let i = 0; i < audioTracks.length; ++i) {
        if (i === selectedAudioTrackIndex) {
          audioTracks[i].enabled = true;
        } else {
          audioTracks[i].enabled = false; 
        }
      }
      const options: string[] = [];
      const audioTrackLabels: {[key: string]: string} = {};
      for (let i = 0; i < audioTracks.length; ++i) {
        options.push(audioTracks[i].id);
        audioTrackLabels[audioTracks[i].id] = audioTracks[i].label;
      }
      if (window.dashjs) {
        (window.dashjs as any) = undefined;
      }
      setPlayer(new Plyr(videoElement, {
        quality: {
          default: 'auto',
        },
        controls: ['play-large', 'play', 'progress', 'current-time', 'captions', 'settings', 'fullscreen', 'rewind'],
        settings: ['captions', 'speed', 'audioTrack'],
        captions: {active: true, update: false},
        previewThumbnails: {enabled: true, src: props.thumbnailsFile},
        audioTrack: {
          options: options,
          selected: selectedAudioTrackId,
          onChange: (e: string) =>  {
            for (let i = 0; i < audioTracks.length; ++i) {
              if (audioTracks[i] == undefined) continue;
              if (audioTracks[i].id === e) {
                audioTracks[i].enabled = true;
              } else {
                audioTracks[i].enabled = false;
              }
            }
          },
        },
        i18n: {
          audioTrack: 'Language',
          audioTrackLabel: audioTrackLabels
        },
        seekTime: 5
      } as any));
    });

    return () => {
      player?.destroy();
    };
  }, []);
 
  return (
     <div>
        <video ref={videoRef}
               id="player"
               style={{objectFit: 'contain'}}
               src={props.hlsFile}>
          <track kind="captions" label="English captions" src="https://d6v3p7mgzd95s.cloudfront.net/b5cf05ab-fe78-4aa8-a36f-e433691ecd14/vod/ru.vtt" srcLang="en" default />
        </video>
     </div>  
  )
}

export default SafariPlayer;
