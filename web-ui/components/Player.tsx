import { useRouter } from 'next/router';
import React, { RefObject, useEffect, useState } from 'react';
import shaka from 'shaka-player';
import axios from 'axios';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { yellow } from '@mui/material/colors';

const SubsLangCodes = {
  EN_US : { langTag : "en-US" },
  RU : { langTag : "ru" }
} as const;

function VideoPlayer () {
  const [videoComponent] = useState(React.createRef() as RefObject<any>);
  const [backdropImage, setBackdropImage] = useState();
  const router = useRouter();
  useEffect(() => {
	const paramString = router.asPath.split("?")[1];
	const movieId = new URLSearchParams(paramString).get('movieId');
	document.addEventListener('shaka-ui-loaded', () => {
	  axios.get(`https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod/getMovieMetadataForPlayer/${movieId}`)
	  .then((x) => {
	  	setBackdropImage(x.data.backdropImage);  
	  	var manifestUri = x.data.mpdFile;  
	  	const video = videoComponent.current;
	  	const ui = video['ui'];
	  	var player = ui.getControls().getPlayer();
	  	ui.getControls().getLocalization().changeLocale([router.locale]);  
	  	player.getNetworkingEngine()?.registerRequestFilter(function(type: any, request: { uris: string[]; }) {
	  		if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST ||
	  		type === shaka.net.NetworkingEngine.RequestType.SEGMENT) {
	  			request.uris[0] += `?${x.data.cloudFrontSignedUrlParams}`;
	  		}
	  	});  
	  	const subtitles = x.data.subtitles as {[key: string]: string};
	  	// Try to load a manifest.
	  	// This is an asynchronous process.
	  	player.load(manifestUri).then((v: any) => {
	  	Object.keys(subtitles).forEach(k => player.addTextTrackAsync(subtitles[k], SubsLangCodes[k as keyof typeof SubsLangCodes].langTag, 'text'))
	  	});
	  })});
  }, []);

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  return (
	<div data-shaka-player-container style={{width: '100vw', height: '100vh'}}>	
	  <video
	    data-shaka-player
	    style={{width: '100vw', height: '100vh', objectFit: 'contain', maxWidth: '100%', maxHeight: '100%', position: 'absolute'}}
	    ref={videoComponent}
	    poster={backdropImage == undefined ? undefined : `${imageBaseUrl}h_720/${backdropImage}`}
	  />
	</div>
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
