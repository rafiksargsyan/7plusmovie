import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
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
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return isSafari ?
	       ( <video width="100%" height="100%"
		       style={{objectFit: 'contain', position: 'absolute', maxHeight: '100vh'}}
		       controls src={props.m3u8File}
			   poster={`${imageBaseUrl}h_720,f_auto/${props.backdropImage}`}
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
