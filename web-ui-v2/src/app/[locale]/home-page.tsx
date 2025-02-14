'use client'
import { AppShell, Burger, Button, Container, Divider, Group, Select, Space, Stack, Text, Title, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLanguage } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { Hero } from '@/components/Hero/Hero';
import { Carousel } from '@mantine/carousel';
import { MovieCard } from '@/components/MovieCard/MovieCard';
import { TvShowCard } from '@/components/TvShowCard/TvShowCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { useSearchParams } from 'next/navigation';

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
  const icon = <IconLanguage size={16} />;
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const carouselControlMargin = xsOrSmaller ? '-1.7rem' : '-2rem';

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
          <Group align="center">
            <LocaleSelectButton defaultLocaleDisplayName={Locale.FROM_LANG_TAG[locale].nativeDisplayName}
            onLocaleSelect={(value) => { value && router.replace(`${pathname}?${searchParams.toString()}`, {locale: value}); }}/>
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
        <Hero title={t("hero.title")}/>
        <Container size="xl">
          <Space h="xl"/>
          <Space h="xl"/>
          <Stack component="article">
            <Title order={2}>{t("latest_movie_updates")}</Title>
            <Carousel height={'auto'} dragFree={true} slideSize={{ base: "10%"}} slideGap="md" align="start"
            controlSize={xsOrSmaller ? 30 : 40} containScroll='trimSnaps'
            styles={{
              control: {
                marginLeft: carouselControlMargin,
                marginRight: carouselControlMargin
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
          <Space h="xl"/>
          <Stack component="article">
            <Title order={2}>{t("latest_tvshow_updates")}</Title>
            <Carousel height={'auto'} dragFree={true} slideSize={{ base: "10%"}} slideGap="md" align="start"
            controlSize={xsOrSmaller ? 30 : 40} containScroll='trimSnaps'
             styles={{
              control: {
                marginLeft: carouselControlMargin,
                marginRight: carouselControlMargin
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
