'use client'
import { AppShell, Burger, Container, Group,  Space, Stack, Title, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure, useHeadroom } from '@mantine/hooks';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { Carousel } from '@mantine/carousel';
import { MovieCard } from '@/components/MovieCard/MovieCard';
import { TvShowCard } from '@/components/TvShowCard/TvShowCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { useSearchParams } from 'next/navigation';
import { hotjar } from 'react-hotjar';
import { useEffect } from 'react';
import AdsterraBanner from '@/components/AdsterraBanner/AdsterraBanner';
import AdsterraNativeBanner from '@/components/AdsterraNativeBanner/AdsterraNativeBanner';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

interface MovieRelease {
  id: string;
  title: string;
  year: string;
  quality: string;
  releaseId: string;
  posterImagePath: string;
}

interface TvShowUpdate {
  id: string;
  title: string;
  year: string;
  season: number;
  episode: number;
  releaseId: string;
  posterImagePath: string;
}

interface HomePageProps {
  recentMovieReleases: MovieRelease[];
  recentTvShowUpdates: TvShowUpdate[];
}

export default function HomePage(props: HomePageProps) {
  const [opened, { toggle }] = useDisclosure();
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const smOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const carouselControlMargin = xsOrSmaller ? '-1.7rem' : '-2rem';
  const pinned = useHeadroom({ fixedAt: 60 });

  useEffect(() => {
    hotjar.initialize({id: 3841658, sv: 6});
  }, []);

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
            <Group align="center">
              <LocaleSelectButton defaultLocaleDisplayName={Locale.FROM_LANG_TAG[locale].nativeDisplayName}
              onLocaleSelect={(value) => { if (value != null) {router.replace(`${pathname}?${searchParams.toString()}`, {locale: value}); router.refresh(); }}}/>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <Group>
          <Burger opened={true} onClick={toggle} size="sm" />
        </Group>
        <Space h="xl" />
        <Link prefetch={true} href="/"><UnstyledButton>{t('home')}</UnstyledButton></Link>
        <Space h="xl" />
        <Link prefetch={true} href='/movies'><UnstyledButton>{t('movies')}</UnstyledButton></Link>
        <Space h="xl" />
        <Link prefetch={true} href='/tv-shows'><UnstyledButton>{t('tvshows')}</UnstyledButton></Link>
        <Space h="xl" />
        <Link prefetch={true} href='/contact'><UnstyledButton>{t('contact')}</UnstyledButton></Link>
        <Space h="xl" />
      </AppShell.Navbar>
      <AppShell.Main>
        <Container size="xl">
          <Space h="xl"/>
          <Space h="xl"/>
          <Group justify='center'>
            {!smOrSmaller && <AdsterraBanner adKey={'65485502e263f33728c73d35f0a0a5ac'} height={90} width={728} /> }
            {!xsOrSmaller && smOrSmaller && <AdsterraBanner adKey={'3d22ee119d4fa58249ae5cf94ce0b2f9'} height={60} width={468} /> }
            {xsOrSmaller && <AdsterraBanner adKey={'9ec37fad29fe000a6f28be4cb07fef02'} height={50} width={320} /> }
          </Group>
          <Stack component="article">
            <Title order={2}>{t("latest_movie_updates")}</Title>
            <Carousel height={'auto'} dragFree={true} slideSize={{ base: "10%"}} slideGap="md" align="start"
            controlSize={xsOrSmaller ? 30 : 40} containScroll='trimSnaps'
            styles={{
              control: {
                marginLeft: carouselControlMargin,
                marginRight: carouselControlMargin,
                backgroundColor: 'var(--mantine-color-white) !important',
                color: 'var(--mantine-color-black) !important',
                border: '1px solid var(--mantine-color-gray-3) !important'
              }
            }}>
              { 
                props.recentMovieReleases.map(r => <Carousel.Slide key={r.id}>
                  <MovieCard alt={`${r.title} (${r.year})`} quality={r.quality} title={r.title} year={r.year}
                  url={`${locale}/movie?id=${r.id}&releaseId=${r.releaseId}`} imageBaseUrl={imageBaseUrl} imagePath={`${r.posterImagePath}`} />
                </Carousel.Slide>)
              }
            </Carousel>
          </Stack>
          <AdsterraNativeBanner />
          <Space h="xl"/>
          <Stack component="article">
            <Title order={2}>{t("latest_tvshow_updates")}</Title>
            <Carousel height={'auto'} dragFree={true} slideSize={{ base: "10%"}} slideGap="md" align="start"
            controlSize={xsOrSmaller ? 30 : 40} containScroll='trimSnaps'
             styles={{
              control: {
                marginLeft: carouselControlMargin,
                marginRight: carouselControlMargin,
                backgroundColor: 'var(--mantine-color-white) !important',
                color: 'var(--mantine-color-black) !important',
                border: '1px solid var(--mantine-color-gray-3) !important'
              } 
            }}>
              {
                props.recentTvShowUpdates.map(r => <Carousel.Slide key={r.id}>
                  <TvShowCard alt={`${r.title} (${r.year})`} title={r.title} year={r.year}
                  url={`${locale}/tv-show?id=${r.id}&s=${r.season}&e=${r.episode}&releaseId=${r.releaseId}`} imageBaseUrl={imageBaseUrl}
                  imagePath={`${r.posterImagePath}`} season={r.season} episode={r.episode} />
                </Carousel.Slide>)
              }
            </Carousel>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
