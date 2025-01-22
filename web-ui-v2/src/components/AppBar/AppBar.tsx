'use client'
import IconButton from "@mui/material/IconButton";
import { Autocomplete } from "../Autocomplete/Autocomplete";
import MenuIcon from '@mui/icons-material/Menu';
import styles from './AppBar.module.css';
import grey from "@mui/material/colors/grey";
import { AlgoliaAutocomplete } from "../Autocomplete/AlgoliaAutocomplete";
import { getAlgoliaResults } from "@algolia/autocomplete-js";
import { liteClient as algoliasearch } from 'algoliasearch/lite';

const appId = 'latency';
const apiKey = '6be0576ff61c053d5f9a3225e2a90f76';
const searchClient = algoliasearch(appId, apiKey);

export function ProductItem({ hit, components }) {
  return (
    <a href={hit.url} className="aa-ItemLink">
      <div className="aa-ItemContent">
        <div className="aa-ItemTitle">
          <components.Highlight hit={hit} attribute="name" />
        </div>
      </div>
    </a>
  );
}

export function AppBar() {
  return (
    <header className={styles.root}>
      <IconButton
        size="large"
        edge="start"
        sx={{ color: "white",  "&:hover": { bgcolor: grey[900] } }}
      >
        <MenuIcon />
      </IconButton>
      {/* <Autocomplete inputPlaceholder="Search" className={styles.autocomplete}/> */}
      <AlgoliaAutocomplete
        openOnFocus={true}
        getSources={({ query }) => [
          {
            sourceId: 'products',
            getItems() {
              return getAlgoliaResults({
                searchClient,
                queries: [
                  {
                    indexName: 'instant_search',
                    params: {
                      query,
                      hitsPerPage: 5,
                    },
                  }
                ],
              });
            },
            templates: {
              item({ item, components }) {
                return <ProductItem hit={item} components={components} />;
              },
            },
          },
        ]}
      />
    </header>
  )
}
