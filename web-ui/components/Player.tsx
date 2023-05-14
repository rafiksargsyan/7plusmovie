import React, { useEffect, useRef, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import ShakaPlayer from 'shaka-player-react';
import 'shaka-player-react/dist/controls.css';

const SubsLangCodes = {
  EN_US : { langTag : "en-US" },
  RU : { langTag : "ru" }
} as const;

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	  primary: {
		main: red[600],
	  }
  },
});

function VideoPlayer(props: {mpdFile: string, backdropImage: string, subtitles: {[key: string]: string}, playerLocale: string}) {
  const controllerRef = useRef(null);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
	if (counter === 0) setCounter(1);
	const {
	  player,
	  ui,
	  videoElement
	} = controllerRef.current as any;
	if (player == null) return;
	ui.getControls().getLocalization().changeLocale([props.playerLocale]);
	// Try to load a manifest.
	// This is an asynchronous process.
	player.load(props.mpdFile).then((v: any) => {
	  Object.keys(props.subtitles).forEach(k => player.addTextTrackAsync(props.subtitles[k], SubsLangCodes[k as keyof typeof SubsLangCodes].langTag, 'text'))	
	  player.selectAudioLanguage(props.playerLocale);
	});
  }, [counter]);

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  return (
	<ShakaPlayer className="shaka-player-video-container" ref={controllerRef} poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
				 style={{width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', position: 'absolute'}}/>
 
  );
}

function VideoPlayerWrapper(props: {mpdFile: string, backdropImage: string, subtitles: {[key: string]: string}, playerLocale: string}) {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer {...props} />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
