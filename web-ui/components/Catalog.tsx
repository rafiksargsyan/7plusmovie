import React, { useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { red } from '@mui/material/colors';
import Grid from '@mui/material/Grid';
import Popper from '@mui/material/Popper';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import algoliasearch from 'algoliasearch';
import { MenuItem, Select, Typography } from '@mui/material';
import Link from 'next/link';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: red[600],
    }
  },
});

const searchBoxTheme = createTheme({
  palette: {
    mode: 'light',
  },
  components: {
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          backgroundColor: 'white',
        }
      }
    },
  }
});

const algoliaClient = algoliasearch(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!, process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!);
const algoliaQuerySuggestionsIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_QUERY_SUGGESTIONS_ALL_INDEX!);

const L8nLangCodes = {
  EN_US : { langTag : "en-US", countryCode: "US" },
  RU : { langTag : "ru", countryCode: "RU" }
} as const;

const L8nTable = {
  EN_US : {
    SEARCH_PLACEHOLDER: "Search titles, genres, persons",
    RU: "Russian",
    EN_US: "American English",
    EMPTY_RESULT_MSG: "Oops, we couldn't find anything. Try to adjust your search."
  },
  RU : {
    SEARCH_PLACEHOLDER: "Искать фильмы, жанры, людей",
    RU: "Русский",
    EN_US: "Американский английский",
    EMPTY_RESULT_MSG: "Упс, мы ничего не нашли. Попробуйте скорректировать поиск."
  }
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

function CustomAppBar(props: {onSearchChange: (searchString: string | null) => void,
                              onLocaleChange: (locale: string) => void, locale: string,
                              searchString: string | null}) {
  const [state, setState] = useState({options: []});
  
  const onInputChange = (event: React.SyntheticEvent<Element, Event>, value: string) => {
    if (value == null || value.trim() == '') {
      setState({options: []});
      return;
    }
    algoliaQuerySuggestionsIndex.search<{query: string}>(value).then(result => {
      setState({options: result.hits.map(_ => _.query) as never[]});
    });
  };
  
  const onChange = (event: React.SyntheticEvent<Element, Event>, value: string | null) => {
    props.onSearchChange(value);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed'>
        <Toolbar variant='dense' sx={{ justifyContent: "space-between" }}>
          <div></div>
          <ThemeProvider theme={searchBoxTheme}>
            <Autocomplete
              value={props.searchString === '' ? undefined : props.searchString}
              onInputChange={onInputChange}
              onChange={onChange}
              sx={{ flex: 'auto', maxWidth: 700, "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { border: 'none', "&:hover": { border: 'none' }}}}
              componentsProps={{ paper: {sx: {mt: 0.5}}}}
              PopperComponent={(props: any) => <Popper {...props} popperOptions={{strategy: 'fixed'}}/>}
              freeSolo
              options={state.options}
              filterOptions={(options, state) => options}
              renderInput={(params) => <TextField {...params} variant='outlined' size='small' placeholder={L8nTable[props.locale as keyof typeof L8nTable]['SEARCH_PLACEHOLDER']} />}
              ListboxProps={{ style: { maxHeight: 400, transform: 'none' } }}
            />
          </ThemeProvider>
          <L8nSelect onLocaleChange={props.onLocaleChange} currentLocale={props.locale}/>
        </Toolbar>
      </AppBar>
      <Toolbar variant='dense'/>
    </Box>
  );
}

function GridView(props: CatalogProps) {
  const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;
  const locale = props.currentLocale;
  return (
    <Grid container sx={{p: 2}} spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 4, md: 5, lg: 7, xl: 9 }}>
      {props.movies.length > 0 ?
         props.movies.map((_: MovieItem, index) => (
          <Grid item xs={1} sm={1} md={1} lg={1} xl={1} key={index}>
            <Card sx={{position: 'relative', borderRadius: 0}}>
              <CardActionArea>
                <Link href={_.category == "TV_SHOW" ? {pathname: '/tv-show', query : {id: _.id}} : {pathname: '/player', query: {movieId: _.id}}}>
                  <CardMedia
                    component="img"
                    src={`${imageBaseUrl}w=160,f=auto/${_.posterImagesPortrait[locale]}`}
                    srcSet={`${imageBaseUrl}w=240,f=auto/${_.posterImagesPortrait[locale]} 240w, ${imageBaseUrl}w=160,f=auto/${_.posterImagesPortrait[locale]} 160w`}
                    alt={`${_.titleL8ns[locale] != null ? _.titleL8ns[locale] : _.originalTitle} (${_.releaseYear})`}
                    sizes="(max-width: 1200px) 160px, 240px"
                    loading="lazy"
                    sx={{aspectRatio: '2 / 3', objectFit: 'fill', backgroundImage: 'url("/no-image-holder.svg")'}}
                  />
                </Link>
              </CardActionArea>     
              <Typography color="text.primary"
                          sx={{ typography: { sm: 'body1', xs: 'body2' }, position: 'absolute', bottom: 0,
                                right: 0, mr: { sm: 1, xs: 0.5 }, mb: { sm: 1, xs: 0.5 },
                                pr: { sm: 1, xs: 0.5 }, pl: { sm: 1, xs: 0.5 }, backgroundColor: 'primary.main'}}>
                {_.releaseYear}
              </Typography>
            </Card>
          </Grid>
        )) : (
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Typography sx={{p: 2}} variant="subtitle1" align="center" color="text.secondary">
              {L8nTable[locale as keyof typeof L8nTable]['EMPTY_RESULT_MSG']}
            </Typography>
          </Box>
        )
      }
    </Grid>
  )
}

interface MovieItem {
  id: string;
  originalTitle: string;
  titleL8ns: {[key: string]: string};
  releaseYear: number;
  posterImagesPortrait: {[key: string]: string};
  category: "TV_SHOW" | "MOVIE";
}

interface CatalogProps {
  movies: MovieItem[];
  currentLocale: string;
  searchString: string | null;
  onSearchChange: (searchString: string | null) => void;
  onLocaleChange: (locale: string) => void;
}

function Catalog(props: CatalogProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <CustomAppBar onSearchChange={props.onSearchChange} onLocaleChange={props.onLocaleChange} locale={props.currentLocale} searchString={props.searchString}/>
      <GridView {...props}/>
    </ThemeProvider>
  );
}

export default Catalog;
