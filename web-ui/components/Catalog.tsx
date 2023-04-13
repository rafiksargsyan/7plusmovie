import React, { useEffect, useState } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { yellow, indigo } from '@mui/material/colors';
import Grid from '@mui/material/Grid';
import Popper from '@mui/material/Popper';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardMedia from '@mui/material/CardMedia';
import algoliasearch from 'algoliasearch';
import { useRouter } from 'next/router'
import { alpha, Tooltip, Typography } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: yellow[600],
    }
  },
});

const searchBoxTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: indigo[500]
    }
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
const algoliaIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!);
const algoliaQuerySuggestionsIndex = algoliaClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_QUERY_SUGGESTIONS_ALL_INDEX!);

function CustomAppBar(props: {onSearchChange: (searchString: string | null) => void, onEnter: () => void}) {
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

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      props.onEnter();
    }
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position='fixed'>
        <Toolbar sx={{ justifyContent: "center" }}>
          <ThemeProvider theme={searchBoxTheme}>
            <Autocomplete
              onKeyDown={onKeyDown}
              onInputChange={onInputChange}
              onChange={onChange}
              sx={{ flex: 'auto', maxWidth: 700, "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { border: 'none', "&:hover": { border: 'none'}}}}
              componentsProps={{ paper: {sx: {mt: 0.5}}}}
              PopperComponent={(props: any) => <Popper {...props} popperOptions={{strategy: 'fixed'}}/>}
              freeSolo
              options={state.options}
              filterOptions={(options, state) => options}
              renderInput={(params) => <TextField {...params} variant='outlined' placeholder="Search titles"/>}
              ListboxProps={{ style: { maxHeight: 400, transform: 'none' } }}
            />
          </ThemeProvider>
        </Toolbar>
      </AppBar>
      <Toolbar/>
    </Box>
  );
}

function GridView(props: { searchString: string }) {
  const [state, setState] = useState({movies: []});

  useEffect(() => {
    algoliaIndex.search<{objectID: string, originalTitle: string, releaseYear: number, posterImagesPortrait: {string: string}}>(props.searchString).then(result => {
      setState({movies: result.hits.map(_ => ({id: _.objectID, ot: _.originalTitle, ry: _.releaseYear, pi: _.posterImagesPortrait})) as never[]});
    });
  }, [props.searchString]);

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  const router = useRouter();

  return (
    <Grid container sx={{p: 2}} spacing={{ xs: 2, md: 3 }} columns={{ xs: 3, sm: 4, md: 5, lg: 6, xl: 7 }}>
      {state.movies.map((_: {id: string, ot: string, ry: number, pi: {[key: string]: string}}, index) => (
        <Grid item xs={1} sm={1} md={1} lg={1} xl={1} key={index}>
          <Tooltip title={`${_.ot} (${_.ry})`} followCursor>
            <Card>
              <CardActionArea sx={{position: 'relative'}} onClick={() => {router.push(`/player?movieId=${_.id}`)}}>
                <CardMedia
                  component="img"
                  src={`${imageBaseUrl}w_160/${_.pi['EN_US']}`}
                  srcSet={`${imageBaseUrl}w_240/${_.pi['EN_US']} 240w, ${imageBaseUrl}w_160/${_.pi['EN_US']} 160w`}  
                  alt={`${_.ot} (${_.ry})`}
                  sizes="(max-width: 1200px) 160px, 240px"
                />
              </CardActionArea>
            </Card>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  )
}

function Catalog() {
  const [state, setState] = useState({searchString: ''});

  const onSearchChange = (searchString: string | null) => setState({searchString: searchString != null ? searchString : ''});

  const onEnter = () => setState({searchString: state.searchString});
  
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <CustomAppBar onSearchChange={onSearchChange} onEnter={onEnter}/>
      <GridView searchString={state.searchString}/>
    </ThemeProvider>
  );
}

export default Catalog;
