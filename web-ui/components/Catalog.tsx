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
import { MenuItem, Select, Tooltip } from '@mui/material';
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

const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

const L8nTable = {
  EN_US : {
    SEARCH_PLACEHOLDER: "Search titles",
    RU: "Russian",
    EN_US: "American English"
  },
  RU : {
    SEARCH_PLACEHOLDER: "Искать фильмы",
    RU: "Русский",
    EN_US: "Американский английский"
  }
}

function L8nSelect(props: {onLocaleChange: (locale: string) => void, currentLocale: string}) {
  return (
    <Select value={props.currentLocale} inputProps={{ IconComponent: () => null, sx: { paddingRight: '14px !important'}}}
            onChange={(e, c) => props.onLocaleChange(e.target.value)}>
      {Object.keys(L8nLangCodes).map((_) => (
        <MenuItem value={_} key={_}>
          <img src={`https://flagcdn.com/w20/${L8nLangCodes[_ as keyof typeof L8nLangCodes].countryCode.toLowerCase()}.png`}
               srcSet={`https://flagcdn.com/w40/${L8nLangCodes[_ as keyof typeof L8nLangCodes].countryCode.toLowerCase()}.png 2x`}
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
        <Toolbar sx={{ justifyContent: "space-between" }}>
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
              renderInput={(params) => <TextField {...params} variant='outlined' placeholder={L8nTable[props.locale as keyof typeof L8nTable]['SEARCH_PLACEHOLDER']} />}
              ListboxProps={{ style: { maxHeight: 400, transform: 'none' } }}
            />
          </ThemeProvider>
          <L8nSelect onLocaleChange={props.onLocaleChange} currentLocale={props.locale}/>
        </Toolbar>
      </AppBar>
      <Toolbar/>
    </Box>
  );
}

function GridView(props: CatalogProps) {
  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  return (
    <Grid container sx={{p: 2}} spacing={{ xs: 2, md: 3 }} columns={{ xs: 3, sm: 5, md: 6, lg: 7, xl: 8 }}>
      {props.movies.map((_: MovieItem, index) => (
        <Grid item xs={1} sm={1} md={1} lg={1} xl={1} key={index}>
          <Tooltip title={`${_.title} (${_.releaseYear})`} followCursor>
            <Card>
              <Link href={{pathname: '/player', query: {movieId: _.id}}}>
                <CardActionArea>
                  <CardMedia
                    component="img"
                    src={`${imageBaseUrl}w_160/${_.posterImage}`}
                    srcSet={`${imageBaseUrl}w_240/${_.posterImage} 240w, ${imageBaseUrl}w_160/${_.posterImage} 160w`}
                    alt={`${_.title} (${_.releaseYear})`}
                    sizes="(max-width: 1200px) 160px, 240px"
                  />
                </CardActionArea>
              </Link>
            </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  )
}

interface MovieItem {
  id: string;
  title: string;
  releaseYear: number;
  posterImage: string;
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
