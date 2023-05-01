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

function VideoPlayer(props: {mpdFile: string, cloudFrontSignedUrlParams: string, backdropImage: string, subtitles: {[key: string]: string}}) {
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
	player.getNetworkingEngine()?.registerRequestFilter(function(type: any, request: { uris: string[]; }) {
	  if (type === 0 || type === 1) {
		request.uris[0] += `?${props.cloudFrontSignedUrlParams}`;
	  }
	});
	// Try to load a manifest.
	// This is an asynchronous process.
	player.load(props.mpdFile).then((v: any) => {
	  Object.keys(props.subtitles).forEach(k => player.addTextTrackAsync(props.subtitles[k], SubsLangCodes[k as keyof typeof SubsLangCodes].langTag, 'text'))	
	});
  }, [counter]);

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  return (
	<ShakaPlayer className="shaka-player-video-container" ref={controllerRef} poster={`${imageBaseUrl}h_720/${props.backdropImage}`}
				 style={{width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', position: 'absolute'}}/>
 
  );
}

function VideoPlayerWrapper(props: {mpdFile: string, cloudFrontSignedUrlParams: string, backdropImage: string, subtitles: {[key: string]: string}}) {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer {...props} />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
