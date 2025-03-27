'use client'
import { AppShell, Box, Burger, Container, Group, SimpleGrid, Space, Stack, Text, UnstyledButton, useMantineTheme} from '@mantine/core';
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { MovieCard } from '@/components/MovieCard/MovieCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { Autocomplete } from '@/components/Autocomplete/Autocomplete';
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
  const pinned = useHeadroom({ fixedAt: 60 });

  return (
    <AppShell
      layout="alt"
      header={{ height: 60, collapsed: !pinned, offset: false }}
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
          <Stack component="article">
            { props.recentMovieReleases.length === 0 ? <Text style={{textAlign: 'center'}}>{t('emptySearchResultsMessage')}</Text> :
            <SimpleGrid cols={{base: 1, xs: 2, sm: 3, md: 4, lg: 5, xl: 5}}>
              { 
                props.recentMovieReleases.map(r => 
                  <MovieCard key={`${r.title} (${r.year})`} alt={`${r.title} (${r.year})`} quality={r.quality} title={r.title}
                  year={r.year} url={`movie?id=${r.id}`} imageBaseUrl={imageBaseUrl} imagePath={`${r.posterImagePath}`} />
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
