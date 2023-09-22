import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import DashPlayer from './DashPlayer';
import SafariPlayer from './SafariPlayer';

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

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

  return isSafari ?
	       ( <SafariPlayer
			  localeCode={props.localeCode}
			  poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
			  hlsFile={props.m3u8File}
		      thumbnailsFile={props.thumbnailsFile}
			  subtitles={props.subtitles}
			 /> ) :
		   ( <DashPlayer
		       localeCode={props.localeCode}
			   poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
			   mpdFile={props.mpdFile}
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
