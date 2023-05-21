import React, { useEffect, useRef, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import ReactPlayer from 'react-player';
import PlayerControllerOverlay from './PlayerControllerOverlay';
import screenfull from 'screenfull';
import { useMediaQuery } from '@mui/material';

const SubsLangCodes = {
  EN_US : { langTag : "en-US" },
  RU : { langTag : "ru" },
  RU_FORCED : { langTag : "ru-x-forced" }
} as const;

const SubsLangCode2Label = {
  EN_US : "English (US)",
  RU : "Русский",
  RU_FORCED : "Русский (форсированный)"	 
}

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	primary: {
	  main: red[600],
	}
  },
});

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

function VideoPlayer(props: {mpdFile: string, m3u8File: string, backdropImage: string, localeCode: string,
	                         subtitles: {[key: string]: string}, playerLocale: string, movieTitle: string}) {
  const playerRef = useRef(null);
  const [player, setPlayer] = useState<any>(null);
  const [hls, setHls] = useState<any>(null);
  const [dash, setDash] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(1000000000);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [audioTracks, setAudioTracks] = useState<string[] | null>(null);
  const [currentAudioTrack, setCurrentAudioTrack] = useState(0);
  const [currentTextTrack, setCurrentTextTrack] = useState(-1);

  function handleFullScreen() {
	if (screenfull.isEnabled) {
	  screenfull.toggle();
	  setIsFullScreen(!isFullScreen);
	}
  }

  useEffect(() => {
	if (playerRef.current != null) {
	  const currentPlayer = playerRef.current as any;
      setPlayer(currentPlayer);
	}
  }, [])

  useEffect(() => {
	const handleFullScreenChange = () => {
	  setIsFullScreen(screenfull.isFullscreen);
	};
  
	screenfull.on('change', handleFullScreenChange);
  
	return () => {
	  screenfull.off('change', handleFullScreenChange);
	};
  }, []);

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const onPlay = () => {
	if (player == null) return;
	setIsPlaying(true);
  }  

  const onPause = () => {
    if (player == null) return;
	setIsPlaying(false);
  }

  const onReplay = (seconds: number) => {
    player.seekTo(player.getCurrentTime() - seconds, "seconds");
  }

  const onForward = (seconds: number) => {
    player.seekTo(player.getCurrentTime() + seconds, "seconds");
  }

  const onProgress = (progressObject: any) => {
    setProgress(progressObject.playedSeconds);
	if (hls != null && audioTracks == null) {
	  setAudioTracks(hls.audioTracks.map((_:any) => _.attrs['NAME']));
	}
  }

  const onDuration = (duration: number) => {
	setDuration(duration);
  }

  const onSeekCompleted = (event: Event, newValue: number | number[]) => {
	player.seekTo(newValue as number, "seconds");
  } 

  const lessThanMd = useMediaQuery(darkTheme.breakpoints.down('md'));
  const sliderSize = lessThanMd ? 'small' : 'medium';

  const onReady = () => {
	const hls = player.getInternalPlayer("hls");
	const dash = player.getInternalPlayer("dash");
	setHls(hls);
	setDash(dash);
    if (dash != null) {
	  setAudioTracks(dash.getTracksFor('audio').map((_ : any) => _.labels[0].text));
	  if (currentAudioTrack != -1) {
	    dash.setCurrentTrack(dash.getTracksFor('audio')[currentAudioTrack]);
	  }
	}
  }

  const onAudioTrackChange = (index: number) => {
	setCurrentAudioTrack(index);
	if (index === -1) return;
	if (hls != null) {
      hls.audioTrack = index;
	}
	if (dash != null) {
	  dash.setCurrentTrack(dash.getTracksFor('audio')[index]);
	}
  } 

//   const textTrackLabels: string[] = [];
//   const textTracks: any = [];

//   Object.keys(props.subtitles).sort().forEach(k => {
// 	textTrackLabels.push(SubsLangCode2Label[k as keyof typeof SubsLangCode2Label]);
//     textTracks.push({kind: 'subtitles', src: props.subtitles[k], mode: "showing", srclang: "en"});
//   })

//   if (currentTextTrack != -1) {
// 	textTracks[currentTextTrack].mode="showing"
//   }

//   const onTextTrackChange = (index: number) => {
// 	setCurrentTextTrack(index)
//   }

  return (
	<>
	  <ReactPlayer muted={currentAudioTrack === -1} onReady={onReady} onDuration={onDuration} onProgress={onProgress} volume={1} playing={isPlaying} ref={playerRef} width="100vw" height="100vh"
		  config={{ file: { attributes: { style: { "object-fit": "contain", width: "100vw", height: "100vh", "max-width": "100%", "max-height": "100%", position: "absolute" }, poster: `${imageBaseUrl}h_720,f_auto/${props.backdropImage}` } } }}
		  url={isSafari ? props.m3u8File : props.mpdFile} />
	  <PlayerControllerOverlay isPlaying={isPlaying} onPlay={onPlay} onPause={onPause} onReplay={onReplay}
	                           onForward={onForward} onSeekCompleted={onSeekCompleted} handleFullScreen={handleFullScreen}
							   sliderSize={sliderSize} duration={duration} currentTime={progress} isFullScreen={isFullScreen}
							   movieTitle={props.movieTitle} audioTracks={audioTracks} onAudioTrackChange={onAudioTrackChange}
							   currentAudioTrack={currentAudioTrack} locale={props.localeCode}/>
	</>
  );
}

function VideoPlayerWrapper(props: {mpdFile: string, m3u8File: string, backdropImage: string, localeCode: string,
	                                subtitles: {[key: string]: string}, playerLocale: string, movieTitle: string}) {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer {...props} />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
