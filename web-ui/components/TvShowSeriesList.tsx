import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';

import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import algoliasearch from 'algoliasearch';
import { MenuItem, Select, Stack, Typography } from '@mui/material';
import Link from 'next/link';

const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

const L8nTable = {
  EN_US : {
    EPISODE: "Episode"
  },
  RU : {
    EPISODE: "Эпизод"
  }
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: red[600],
    }
  },
});

interface Episode {
  episodeNumber: number;
  originalName: string;
  nameL8ns: {[key: string]: string};
  stillImage: string;
}
  
interface Season {
  originalName: string;
  seasonNumber: number;
  nameL8ns: {[key: string]: string};
  episodes: Episode[];
}
  
interface TvShowSeriesListProps {
  id: string;
  originalTitle: string;
  titleL8ns: {[key: string]: string};
  releaseYear: number;
  seasons: Season[];
  currentLocale: string;
  posterImagesPortrait: {[key: string]: string};
}

function TvShowSeriesList(props: TvShowSeriesListProps) {
  const tvShowTitle = `${props.titleL8ns[props.currentLocale] != undefined ? props.titleL8ns[props.currentLocale] : props.originalTitle}`;  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      {props.seasons.map(s => {
        const name = `${s.nameL8ns[props.currentLocale] != undefined ? s.nameL8ns[props.currentLocale] : s.originalName}`;
        return (
          <>
            <Typography variant="h5">{`${tvShowTitle} (${name})`}</Typography>
            <div style={{ overflow: "auto", display: "flex" }}>
              {s.episodes.map(e => {
                const episodeName = `${e.nameL8ns[props.currentLocale] != undefined ? e.nameL8ns[props.currentLocale] : e.originalName}`;
                return (
                  <Card key={e.episodeNumber} sx={{borderRadius: 0, width: "240px", flexShrink: 0}}>
                    <CardActionArea>
                      <Link href={{pathname: '/player', query: {tvShowId: props.id, season: s.seasonNumber, episode: e.episodeNumber}}}>
                        <CardMedia
                          component="img"
                          src={`${imageBaseUrl}w_160,f_auto/${e.stillImage}`}
                          srcSet={`${imageBaseUrl}w_240,f_auto/${e.stillImage} 240w, ${imageBaseUrl}w_160,f_auto/${e.stillImage} 160w`}
                          alt={`${episodeName}`}
                          sizes="(max-width: 1200px) 160px, 240px"
                        />
                      </Link>
                    </CardActionArea>     
                    <Typography> {`${L8nTable[props.currentLocale as keyof typeof L8nTable]["EPISODE"]} ${e.episodeNumber} (${episodeName})`} </Typography>
                  </Card>
                )
              })} 
            </div>
          </>  
        )
      })}
    </ThemeProvider>
  );
}

export default TvShowSeriesList;