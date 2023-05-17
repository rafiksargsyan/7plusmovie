import React from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import ReactPlayer from 'react-player';

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

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

function VideoPlayer(props: {mpdFile: string, backdropImage: string, subtitles: {[key: string]: string}, playerLocale: string}) {
  return (
	<ReactPlayer controls width="100vw" height="100vh"
	             config={{ file : {attributes: { style: { "object-fit": "contain", width:"100vw", height:"100vh", "max-width": "100%", "max-height": "100%", position: "absolute"}, poster: `${imageBaseUrl}h_720,f_auto/${props.backdropImage}` } } }}
	             url={props.mpdFile}/>
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
