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

function MyAppBar() {
    const [state, setState] = useState({options: []});
    
    let onInputChange = (event: React.SyntheticEvent<Element, Event>, value: string) => {
      algoliaIndex.search<{originalTitle: string}>(value.trim() != '' ? value.trim() : 'random string').then((x) => {
        setState({options: x.hits.map(x => x.originalTitle) as never[]});
      });
    }
    
    return (
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position='fixed'>
            <Toolbar sx={{ justifyContent: "space-between" }}>
              <ThemeProvider theme={searchBoxTheme}>
                <Autocomplete
                  onInputChange={onInputChange}
                  sx={{ flex: 'auto', maxWidth: 700, "& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline": { border: 'none', "&:hover": { border: 'none'}}}}
                  componentsProps={{ paper: {sx: {mt: 0.5}}}}
                  PopperComponent={(props: any) => <Popper {...props} popperOptions={{strategy: 'fixed'}}/>}
                  freeSolo
                  options={state.options}
                  filterOptions={(options, state) => options}
                  renderInput={(params) => <TextField {...params} variant='outlined' placeholder="Search titles, actors and genres"/>}
                  ListboxProps={{ style: { maxHeight: 400, transform: 'none' } }}
                />
              </ThemeProvider>
            </Toolbar>
          </AppBar>
          <Toolbar />
        </Box>
      );
}

function GridView() {
  const [state, setState] = useState({movies: []});

  useEffect(() => {
    algoliaIndex.search<{objectID: string, originalTitle: string, releaseYear: number, posterImagesPortrait: {string: string}}>("").then((x) => {
      setState({movies: x.hits.map(x => ({id: x.objectID, ot: x.originalTitle, ry: x.releaseYear, pi: x.posterImagesPortrait})) as never[]});
    });
  })

  const imageBaseUrl = process.env.NEXT_PUBLIC_CLOUDINARY_BASE_URL!;

  const router = useRouter();

  return (
    <Grid container sx={{p: 2}} spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}>
      {state.movies.map((_: {id: string, ot: string, ry: number, pi: {[key: string]: string}}, index) => (
        <Grid item xs={1} sm={1} md={1} lg={1} xl={1} key={index}>
          <Card>
            <CardActionArea onClick={() => {router.push(`/player?movieId=${_.id}`)}}>
              <CardMedia
                component="img"
                src={`${imageBaseUrl}w_160/${_.pi['EN_US']}`}
                srcSet={`${imageBaseUrl}w_240/${_.pi['EN_US']} 240w, ${imageBaseUrl}w_160/${_.pi['EN_US']} 160w`}  
                alt={`${_.ot} (${_.ry})`}
                sizes="(max-width: 1200px) 160px, 240px"
              />
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

function Catalog() {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MyAppBar />
      <GridView />  
    </ThemeProvider>
  );
}

export default Catalog;