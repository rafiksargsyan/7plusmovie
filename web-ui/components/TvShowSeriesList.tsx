import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import { AppBar, Box, MenuItem, Select, Toolbar, Typography } from '@mui/material';
import Link from 'next/link';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

const L8nLangCodes = {
  EN_US : { langTag : "en-US", countryCode: "US" },
  RU : { langTag : "ru", countryCode: "RU" }
} as const;

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
  onLocaleChange: (locale: string) => void;
}

function L8nSelect(props: {onLocaleChange: (locale: string) => void, currentLocale: string}) {
  return (
    <Select value={props.currentLocale} inputProps={{ IconComponent: () => null, sx: { paddingTop: '8.5px', paddingBottom: '8.5px', paddingRight: '14px !important'}}}
            onChange={(e, c) => props.onLocaleChange(e.target.value)}>
      {Object.keys(L8nLangCodes).map((_) => (
        <MenuItem value={_} key={_}>
          <img src={`/${L8nLangCodes[_ as keyof typeof L8nLangCodes].countryCode.toLowerCase()}-w20.png`}
               srcSet={`/${L8nLangCodes[_ as keyof typeof L8nLangCodes].countryCode.toLowerCase()}-w40.png 2x`}
               alt={L8nTable[props.currentLocale as keyof typeof L8nTable][_ as keyof typeof L8nTable['EN_US']]} />{" "}
        </MenuItem>
      ))}
    </Select>
  );
}

function CustomAppBar(props: {onLocaleChange: (locale: string) => void, locale: string, title: string}) {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed'>
        <Toolbar variant='dense' sx={{ justifyContent: "space-between" }}>
        <Typography variant="h6" noWrap>{props.title}</Typography>  
          <L8nSelect onLocaleChange={props.onLocaleChange} currentLocale={props.locale}/>
        </Toolbar>
      </AppBar>
      <Toolbar variant='dense'/>
    </Box>
  );
}

function TvShowSeriesList(props: TvShowSeriesListProps) {
  const tvShowTitle = `${props.titleL8ns[props.currentLocale] != undefined ? props.titleL8ns[props.currentLocale] : props.originalTitle}`;  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <CustomAppBar title={tvShowTitle} onLocaleChange={props.onLocaleChange} locale={props.currentLocale}/>
      {props.seasons.map(s => {
        const name = `${s.nameL8ns[props.currentLocale] != undefined ? s.nameL8ns[props.currentLocale] : s.originalName}`;
        return (
          <Box key={s.seasonNumber} sx={{p: 2}}>
            <Typography variant="h6" sx={{mb: 1}}>{name}</Typography>
            <Box sx={{overflow: 'auto', whiteSpace: 'nowrap'}}>
              {s.episodes.map(e => {
                const episodeName = `${e.nameL8ns[props.currentLocale] != undefined ? e.nameL8ns[props.currentLocale] : e.originalName}`;
                return (
                  <Card sx={{display: 'inline-block', mr: { xs: 2, md: 3 }, borderRadius: 0, width: { xs: '60%', sm: '34%', md: '25%', lg: '17%', xl: '13%' }}} key={e.episodeNumber}>
                    <CardActionArea>
                      <Link href={{pathname: '/player', query: {tvShowId: props.id, season: s.seasonNumber, episode: e.episodeNumber}}}>
                        <CardMedia
                          component="img"
                          src={`${imageBaseUrl}w=160,f=auto/${e.stillImage}`}
                          srcSet={`${imageBaseUrl}w=240,f=auto/${e.stillImage} 240w, ${imageBaseUrl}w=160,f=auto/${e.stillImage} 160w`}
                          alt={`${episodeName}`}
                          sizes="(max-width: 1200px) 160px, 240px"
                        />
                      </Link>
                    </CardActionArea>     
                    <Typography variant="subtitle2" noWrap> {`${L8nTable[props.currentLocale as keyof typeof L8nTable]["EPISODE"]} ${e.episodeNumber} (${episodeName})`} </Typography>
                  </Card>
                )
              })} 
            </Box>
          </Box>  
        )
      })}
    </ThemeProvider>
  );
}

export default TvShowSeriesList;