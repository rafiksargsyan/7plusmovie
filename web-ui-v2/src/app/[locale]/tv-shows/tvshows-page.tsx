'use client'
import { AppShell, Box, Burger, Container, Group, SimpleGrid, Space, Stack, Text, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure, useHeadroom } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { TvShowCard } from '@/components/TvShowCard/TvShowCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { createQuerySuggestionsPlugin } from '@algolia/autocomplete-plugin-query-suggestions';
import { useSearchParams } from 'next/navigation';
import { Autocomplete } from '@/components/Autocomplete/Autocomplete';
import { IconSearch } from '@tabler/icons-react';
import { searchClient } from '@algolia/client-search';
import AdsterraBanner from '@/components/AdsterraBanner/AdsterraBanner';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

const algoliaClient = searchClient(process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_ONLY_KEY!, {});

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
  const pinned = useHeadroom({ fixedAt: 60 });
  const smOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

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
      header={{ height: 60, collapsed: !pinned, offset: false  }}
      navbar={{ width: 300, breakpoint: 'sm', collapsed: { mobile: !opened, desktop: !opened } }}
      padding="md"
    >
      <AppShell.Header>
      <Group h="100%" px="md" justify='space-between'>
          <Group justify="space-between" style={{ flex: 1 }}>
            {!opened && <Burger opened={false} onClick={toggle} size="sm" hiddenFrom="sm" />}
            <Group ml="0" gap="md" visibleFrom="sm">    
              <Link prefetch={true} href="/"><UnstyledButton>{t('home')}</UnstyledButton></Link>
              <Link prefetch={true} href='/movies'><UnstyledButton>{t('movies')}</UnstyledButton></Link>
              <Link prefetch={true} href='/tv-shows'><UnstyledButton>{t('tvshows')}</UnstyledButton></Link>
              <Link prefetch={true} href='/contact'><UnstyledButton>{t('contact')}</UnstyledButton></Link>
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
            <><UnstyledButton style={{alignItems: 'center', display: 'inline-flex'}} variant="default" size='lg' aria-label={t('searchButtonAriaLabel')} onClick={() => controlAutocomplete.open()}>
              <IconSearch />
            </UnstyledButton>
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
              if(!(e.state.isOpen)) controlAutocomplete.close();
            }}/>
          </Box></>
            }  
              <LocaleSelectButton defaultLocaleDisplayName={Locale.FROM_LANG_TAG[locale].nativeDisplayName}
              onLocaleSelect={(value) => { if (value != null) {router.replace(`${pathname}?${queryParams.toString()}`, {locale: value}); router.refresh(); }}}/>
            </Group>
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
        <Link prefetch={true} href='/contact'><UnstyledButton>{t('contact')}</UnstyledButton></Link>
        <Space h="xl" />
      </AppShell.Navbar>
      <AppShell.Main>
        <Space h="xl"/>
        <Space h="xl"/>
        <Container size="xl">
          <Group justify='center'>
            {!smOrSmaller && <AdsterraBanner adKey={'65485502e263f33728c73d35f0a0a5ac'} height={90} width={728} /> }
            {!xsOrSmaller && smOrSmaller && <AdsterraBanner adKey={'3d22ee119d4fa58249ae5cf94ce0b2f9'} height={60} width={468} /> }
            {xsOrSmaller && <AdsterraBanner adKey={'9ec37fad29fe000a6f28be4cb07fef02'} height={50} width={320} /> }
          </Group>  
          <Stack component="article">
            { props.recentTvShowUpdates.length === 0 ? <Text style={{textAlign: 'center'}}>{t('emptySearchResultsMessage')}</Text> :
            <SimpleGrid cols={{base: 1, xs: 2, sm: 3, md: 4, lg: 5, xl: 5}}>
              { 
                props.recentTvShowUpdates.map(r => 
                  <TvShowCard key={r.title} alt={`${r.title} (${r.year})`} season={r.season} episode={r.episode}
                  title={r.title} year={r.year} url={`tv-show?id=${r.id}${r.season ? `&s=${r.season}` : ""}${r.episode ? `&e=${r.episode}` : ""}`}
                  imageBaseUrl={imageBaseUrl} imagePath={`${r.posterImagePath}`} />
                )
              }
            </SimpleGrid>
            }
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
