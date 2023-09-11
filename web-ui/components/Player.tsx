import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import DashPlayer from './DashPlayer';

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	primary: {
	  main: red[600],
	}
  },
});

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

function VideoPlayer(props: {mpdFile: string, m3u8File: string, thumbnailsFile?: string, backdropImage: string, localeCode: string,
	                         subtitles: {[key: string]: string}, playerLocale: string, movieTitle: string}) {   
  const [isLandscape, setIsLandscape] = useState(3 * window.innerWidth > 4 * window.innerHeight);
  
  useEffect(() => {
    function checkOrientation() {
      setIsLandscape(3 * window.innerWidth > 4 * window.innerHeight);
    }

    function handleOrientationChange() {
      checkOrientation();
    }

    checkOrientation();

    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return isSafari ?
	       ( <video width="100%" height="100%"
		       style={{objectFit: (isLandscape ? 'fill' : 'contain'), position: 'absolute', maxHeight: '100vh'}}
		       controls src={props.m3u8File}
			   poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
			 /> ) :
		   ( <DashPlayer
			   poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
			   mpdFile={props.mpdFile}
		       isLandscape={isLandscape}
           thumbnailsFile={props.thumbnailsFile}
			 /> );
}

function VideoPlayerWrapper(props: {mpdFile: string, m3u8File: string, thumbnailsFile?: string, backdropImage: string, localeCode: string,
	                                subtitles: {[key: string]: string}, playerLocale: string, movieTitle: string}) {
  return (
	<ThemeProvider theme={darkTheme}>
	  <CssBaseline />
	  <VideoPlayer {...props} />
	</ThemeProvider>
  ); 
}

export default VideoPlayerWrapper;
