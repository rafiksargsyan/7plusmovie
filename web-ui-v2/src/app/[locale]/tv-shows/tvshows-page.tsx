'use client'
import { ActionIcon, AppShell, Box, Burger, Button, Container, Divider, Group, SimpleGrid, Space, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { TvShowCard } from '@/components/TvShowCard/TvShowCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import { algoliaClient } from '../movies/page';
import { useSearchParams } from 'next/navigation';
import { Autocomplete } from '@/components/Autocomplete/Autocomplete';
import { IconSearch } from '@tabler/icons-react';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

interface TvShowUpdate {
  id: string
  title: string;
  year: string;
  season: number;
  episode: number;
  posterImagePath: string;
}

interface TvShowsPageProps {
  recentTvShowUpdates: TvShowUpdate[];
  query: string;
}

export default function TvShowsPage(props: TvShowsPageProps) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const [autoCompleteOpened, controlAutocomplete] = useDisclosure();
  const queryParams = useSearchParams();

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
          if (e.item.__autocomplete_qsCategory === "MOVIE") {
            const params = new URLSearchParams(queryParams.toString());
            params.set('q', e.item.query);
            router.push(`movies?${params.toString()}`);
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
            onLocaleSelect={(value) => { value && router.replace(pathname, {locale: value}); router.refresh() }}/>
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
                props.recentTvShowUpdates.map(r => 
                  <TvShowCard key={r.title} alt={`${r.title} (${r.year})`} season={r.season} episode={r.episode}
                  title={r.title} year={r.year} url={`tv-show?id=${r.id}&s=${r.season}&e=${r.episode}`}
                  imageBaseUrl={imageBaseUrl} imagePath={`${r.posterImagePath}`} />
                )
              }
            </SimpleGrid>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
