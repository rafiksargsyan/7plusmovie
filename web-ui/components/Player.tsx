import React, { useRef } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import ReactPlayer from 'react-player';

const SubsLangCodes = {
  EN_US : { langTag : "en-US" },
  RU : { langTag : "ru" },
  RU_FORCED : { langTag : "ru-x-forced" }
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

function VideoPlayer(props: {mpdFile: string, m3u8File: string, backdropImage: string,
	                         subtitles: {[key: string]: string}, playerLocale: string}) {
  const playerRef = useRef(null);
 
//   const onPlay = () => {
// 	const player: any = playerRef.current;
// 	if (player == null) return;
// 	const dash = player.getInternalPlayer('dash');
// 	const hls = player.getInternalPlayer('hls');
// 	hls.audioTrack=1;
//   } 

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return (
	<ReactPlayer ref={playerRef} controls width="100vw" height="100vh"
	             config={{ file : { attributes: { style: { "object-fit": "contain", width:"100vw", height:"100vh", "max-width": "100%", "max-height": "100%", position: "absolute"}, poster: `${imageBaseUrl}h_720,f_auto/${props.backdropImage}` } } }}
	             url={isSafari ? props.m3u8File : props.mpdFile}/>
  );
}

function VideoPlayerWrapper(props: {mpdFile: string, m3u8File: string, backdropImage: string,
	                                subtitles: {[key: string]: string}, playerLocale: string}) {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer {...props} />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
