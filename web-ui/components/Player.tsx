import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import { MediaPlayer, MediaProvider, Poster } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

const darkTheme = createTheme({
  palette: {
	mode: 'dark',
	primary: {
	  main: red[600],
	}
  },
});

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

function VideoPlayer(props: {mpdFile: string, m3u8File: string, thumbnailsFile?: string, backdropImage: string, localeCode: string,
	                         subtitles: {[key: string]: string}, playerLocale: string, movieTitle: string}) {   
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  return isSafari ?
	       ( <video width="100%" height="100%"
		       style={{objectFit: 'contain', position: 'absolute', maxHeight: '100vh'}}
		       controls src={props.m3u8File}
			   poster={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`}
			 /> ) :
		   (<MediaPlayer title={`${props.movieTitle}`} src={`${props.m3u8File}`}>
              <MediaProvider />
              <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={`${props.thumbnailsFile}`}/>
	  	      <Poster className="vds-poster" src={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`} />
            </MediaPlayer>);
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
