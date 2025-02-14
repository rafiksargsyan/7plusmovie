'use client'
import { ActionIcon, AppShell, Box, Burger, Button, Container, Divider, Group, SimpleGrid, Space, Stack,
    Text, UnstyledButton, 
    useMantineTheme} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { MovieCard } from '@/components/MovieCard/MovieCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { Autocomplete } from '@/components/Autocomplete/Autocomplete';
import { algoliaClient } from './page';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import { useSearchParams } from 'next/navigation';
import { IconSearch } from '@tabler/icons-react';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

interface MovieRelease {
  id: string;  
  title: string;
  year: string;
  quality: string;
  releaseId: string;
  posterImagePath: string;
}

interface MoviesPageProps {
  recentMovieReleases: MovieRelease[];
  query: string;
}

export default function MoviesPage(props: MoviesPageProps) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const [autoCompleteOpened, controlAutocomplete] = useDisclosure();
 
  const querySuggestionsPlugin = createQuerySuggestionsPlugin({
    searchClient: algoliaClient,
    indexName: process.env.NEXT_PUBLIC_ALGOLIA_QUERY_SUGGESTIONS_ALL_INDEX!,
    getSearchParams({ state }) {
      return { hitsPerPage: state.query ? 10 : 0 };
    },
    categoryAttribute: [
      process.env.NEXT_PUBLIC_ALGOLIA_ALL_INDEX!,
      'facets',
      'exact_matches',
      'category',
    ],
    itemsWithCategories: 10,
    categoriesPerItem: 2,
    transformSource({ source }) {
      return {
        ...source,
        onSelect(e: any) {
          controlAutocomplete.close();  
          if (e.item.__autocomplete_qsCategory === "TV_SHOW") {
            const params = new URLSearchParams(queryParams.toString());
            params.set('q', e.item.query);
            router.push(`tv-shows?${params.toString()}`);
          } else {
            const params = new URLSearchParams(queryParams.toString());
            params.set('q', e.state.query);
            router.replace(`?${params.toString()}`);
          }
        }
      };
    },
  });

  return (
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify='space-between'>
          <Group h="100%">
            {!opened && <Burger opened={false} onClick={toggle} size="sm" />}
          </Group>
          { !xsOrSmaller &&
          <Box w={{base: 50, xs: 300, md: 350, lg: 500, xl: 500}}>
            <Autocomplete
              placeholder={t("search.placeholder")}
              initialState={{query: props.query}}
              plugins={[querySuggestionsPlugin]}
              openOnFocus={true}
              onSubmit={(e: any) => {
                const params = new URLSearchParams(queryParams.toString());
                params.set('q', e.state.query);
                router.replace(`?${params.toString()}`);
              }}
              />
          </Box> }
          <Group align="center">
            {xsOrSmaller &&
            <><ActionIcon variant="default" size='lg' aria-label="todo" onClick={() => controlAutocomplete.open()}>
              <IconSearch />
            </ActionIcon>
            <Box style={{display: (autoCompleteOpened ? undefined : 'none')}}>
            <Autocomplete
            placeholder={t("search.placeholder")}
            detachedMediaQuery=''
            initialState={{query: props.query, isOpen: autoCompleteOpened}}
            plugins={[querySuggestionsPlugin]}
            openOnFocus={true}
            onSubmit={(e: any) => {
              controlAutocomplete.close();
              const params = new URLSearchParams(queryParams.toString());
              params.set('q', e.state.query);
              router.replace(`?${params.toString()}`);
            }}
            onStateChange={(e: any) => {
              !(e.state.isOpen) && controlAutocomplete.close();
            }}/>
          </Box></>
            }
            <LocaleSelectButton defaultLocaleDisplayName={Locale.FROM_LANG_TAG[locale].nativeDisplayName}
            onLocaleSelect={(value) => { value && router.replace(`${pathname}/?${queryParams.toString()}`, {locale: value}) }}/>
            <Button>{t('login')}</Button>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Group>
          <Burger opened={true} onClick={toggle} size="sm" />
        </Group>
        <Space h="xl" />
        <Link href="/"><UnstyledButton>{t('home')}</UnstyledButton></Link>
        <Space h="xl" />
        <Link href='/movies'><UnstyledButton>{t('movies')}</UnstyledButton></Link>
        <Space h="xl" />
        <Link href='/tv-shows'><UnstyledButton>{t('tvshows')}</UnstyledButton></Link>
        <Space h="xl" />
        <Divider my="md" label={t('contact')} labelPosition="center"/>
        <Text fw={700}>tracenoon@gmail.com</Text>
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="xl">
          <Stack component="article">
            <SimpleGrid cols={{base: 1, xs: 2, sm: 3, md: 4, lg: 5, xl: 5}}>
              { 
                props.recentMovieReleases.map(r => 
                  <MovieCard key={`${r.title} (${r.year})`} alt={`${r.title} (${r.year})`} quality={r.quality} title={r.title}
                  year={r.year} url={`movie?id=${r.id}`} imageBaseUrl={imageBaseUrl} imagePath={`${r.posterImagePath}`} />
                )
              }
            </SimpleGrid>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
