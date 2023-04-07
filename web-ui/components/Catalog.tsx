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
import { isConstructorDeclaration } from 'typescript';
import { stringify } from 'querystring';

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

  return (
    <Grid container sx={{p: 2}} spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6 }}>
      {state.movies.map((_: {id: string, ot: string, ry: number, pi: {[key: string]: string}}, index) => (
        <Grid item xs={1} sm={1} md={1} lg={1} xl={1} key={index}>
          <Card>
      <CardActionArea>
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

const top100Films = [
  { title: 'The Shawshank Redemption', year: 1994 },
  { title: 'The Godfather', year: 1972 },
  { title: 'The Godfather: Part II', year: 1974 },
  { title: 'The Dark Knight', year: 2008 },
  { title: '12 Angry Men', year: 1957 },
  { title: "Schindler's List", year: 1993 },
  { title: 'Pulp Fiction', year: 1994 },
  {
    title: 'The Lord of the Rings: The Return of the King',
    year: 2003,
  },
  { title: 'The Good, the Bad and the Ugly', year: 1966 },
  { title: 'Fight Club', year: 1999 },
  {
    title: 'The Lord of the Rings: The Fellowship of the Ring',
    year: 2001,
  },
  {
    title: 'Star Wars: Episode V - The Empire Strikes Back',
    year: 1980,
  },
  { title: 'Forrest Gump', year: 1994 },
  { title: 'Inception', year: 2010 },
  {
    title: 'The Lord of the Rings: The Two Towers',
    year: 2002,
  },
  { title: "One Flew Over the Cuckoo's Nest", year: 1975 },
  { title: 'Goodfellas', year: 1990 },
  { title: 'The Matrix', year: 1999 },
  { title: 'Seven Samurai', year: 1954 },
  {
    title: 'Star Wars: Episode IV - A New Hope',
    year: 1977,
  },
  { title: 'City of God', year: 2002 },
  { title: 'Se7en', year: 1995 },
  { title: 'The Silence of the Lambs', year: 1991 },
  { title: "It's a Wonderful Life", year: 1946 },
  { title: 'Life Is Beautiful', year: 1997 },
  { title: 'The Usual Suspects', year: 1995 },
  { title: 'Léon: The Professional', year: 1994 },
  { title: 'Spirited Away', year: 2001 },
  { title: 'Saving Private Ryan', year: 1998 },
  { title: 'Once Upon a Time in the West', year: 1968 },
  { title: 'American History X', year: 1998 },
  { title: 'Interstellar', year: 2014 },
  { title: 'Casablanca', year: 1942 },
  { title: 'City Lights', year: 1931 },
  { title: 'Psycho', year: 1960 },
  { title: 'The Green Mile', year: 1999 },
  { title: 'The Intouchables', year: 2011 },
  { title: 'Modern Times', year: 1936 },
  { title: 'Raiders of the Lost Ark', year: 1981 },
  { title: 'Rear Window', year: 1954 },
  { title: 'The Pianist', year: 2002 },
  { title: 'The Departed', year: 2006 },
  { title: 'Terminator 2: Judgment Day', year: 1991 },
  { title: 'Back to the Future', year: 1985 },
  { title: 'Whiplash', year: 2014 },
  { title: 'Gladiator', year: 2000 },
  { title: 'Memento', year: 2000 },
  { title: 'The Prestige', year: 2006 },
  { title: 'The Lion King', year: 1994 },
  { title: 'Apocalypse Now', year: 1979 },
  { title: 'Alien', year: 1979 },
  { title: 'Sunset Boulevard', year: 1950 },
  {
    title: 'Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb',
    year: 1964,
  },
  { title: 'The Great Dictator', year: 1940 },
  { title: 'Cinema Paradiso', year: 1988 },
  { title: 'The Lives of Others', year: 2006 },
  { title: 'Grave of the Fireflies', year: 1988 },
  { title: 'Paths of Glory', year: 1957 },
  { title: 'Django Unchained', year: 2012 },
  { title: 'The Shining', year: 1980 },
  { title: 'WALL·E', year: 2008 },
  { title: 'American Beauty', year: 1999 },
  { title: 'The Dark Knight Rises', year: 2012 },
  { title: 'Princess Mononoke', year: 1997 },
  { title: 'Aliens', year: 1986 },
  { title: 'Oldboy', year: 2003 },
  { title: 'Once Upon a Time in America', year: 1984 },
  { title: 'Witness for the Prosecution', year: 1957 },
  { title: 'Das Boot', year: 1981 },
  { title: 'Citizen Kane', year: 1941 },
  { title: 'North by Northwest', year: 1959 },
  { title: 'Vertigo', year: 1958 },
  {
    title: 'Star Wars: Episode VI - Return of the Jedi',
    year: 1983,
  },
  { title: 'Reservoir Dogs', year: 1992 },
  { title: 'Braveheart', year: 1995 },
  { title: 'M', year: 1931 },
  { title: 'Requiem for a Dream', year: 2000 },
  { title: 'Amélie', year: 2001 },
  { title: 'A Clockwork Orange', year: 1971 },
  { title: 'Like Stars on Earth', year: 2007 },
  { title: 'Taxi Driver', year: 1976 },
  { title: 'Lawrence of Arabia', year: 1962 },
  { title: 'Double Indemnity', year: 1944 },
  {
    title: 'Eternal Sunshine of the Spotless Mind',
    year: 2004,
  },
  { title: 'Amadeus', year: 1984 },
  { title: 'To Kill a Mockingbird', year: 1962 },
  { title: 'Toy Story 3', year: 2010 },
  { title: 'Logan', year: 2017 },
  { title: 'Full Metal Jacket', year: 1987 },
  { title: 'Dangal', year: 2016 },
  { title: 'The Sting', year: 1973 },
  { title: '2001: A Space Odyssey', year: 1968 },
  { title: "Singin' in the Rain", year: 1952 },
  { title: 'Toy Story', year: 1995 },
  { title: 'Bicycle Thieves', year: 1948 },
  { title: 'The Kid', year: 1921 },
  { title: 'Inglourious Basterds', year: 2009 },
  { title: 'Snatch', year: 2000 },
  { title: '3 Idiots', year: 2009 },
  { title: 'Monty Python and the Holy Grail', year: 1975 },
];

export default Catalog;