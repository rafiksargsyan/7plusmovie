import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { yellow } from '@mui/material/colors';
import ShakaPlayer from 'shaka-player-react';
import 'shaka-player-react/dist/controls.css';

const SubsLangCodes = {
  EN_US : { langTag : "en-US" },
  RU : { langTag : "ru" }
} as const;

function VideoPlayer () {
  const router = useRouter();
  const controllerRef = useRef(null);
  const [backdropImage, setBackdropImage] = useState<string>();
  useEffect(() => {
	const paramString = router.asPath.split("?")[1];
	const movieId = new URLSearchParams(paramString).get('movieId');
	if (controllerRef.current == null) return;
	const {
		/** @type {shaka.Player} */ player,
		/** @type {shaka.ui.Overlay} */ ui,
		/** @type {HTMLVideoElement} */ videoElement
	} = controllerRef.current as any;
	  axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}`)
	  .then((x) => {
		setBackdropImage(`${imageBaseUrl}h_720/${x.data.backdropImage}`);
		if (player == null) return;
        const manifestUri = x.data.mpdFile;
	  	player.getNetworkingEngine()?.registerRequestFilter(function(type: any, request: { uris: string[]; }) {
	  	  if (type === 0 || type === 1) {
	  	  	request.uris[0] += `?${x.data.cloudFrontSignedUrlParams}`;
	  	  }
	  	});  
	  	const subtitles = x.data.subtitles as {[key: string]: string};
	  	// Try to load a manifest.
	  	// This is an asynchronous process.
	  	player.load(manifestUri).then((v: any) => {
	  	  Object.keys(subtitles).forEach(k => player.addTextTrackAsync(subtitles[k], SubsLangCodes[k as keyof typeof SubsLangCodes].langTag, 'text'))
	  	});
	  })
  });

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  return (
	// <div ref={videoContainerComponent} data-shaka-player-container style={{width: '100vw', height: '100vh'}}>	
	//   <video
	//     data-shaka-player
	//     style={{width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', position: 'absolute'}}
	//     ref={videoComponent}
	//     poster={backdropImage == undefined ? undefined : `${imageBaseUrl}h_720/${backdropImage}`}
	//   />
	// </div>
	<ShakaPlayer className="shaka-player-video-container" ref={controllerRef} poster={backdropImage} style={{width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', position: 'absolute'}}/>
  );
}

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	primary: {
	  main: yellow[600],
	}
  },
});

function VideoPlayerWrapper() {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
