'use client'
import { AppShell, Burger, Button, Container, Divider, Group, Select, SimpleGrid, Space, Stack, Text, Title, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLanguage } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { MovieCard } from '@/components/MovieCard/MovieCard';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';

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
}

export default function MoviesPage(props: MoviesPageProps) {
  const [opened, { toggle }] = useDisclosure();
  const icon = <IconLanguage size={16} />;
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

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
                props.recentMovieReleases.map(r => 
                  <MovieCard key={r.title} alt={`${r.title} (${r.year})`} quality={r.quality} title={r.title}
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
