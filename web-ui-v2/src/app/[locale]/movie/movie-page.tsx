'use client'
import { AppShell, Burger, Button, Container, Divider, Group, Select, SelectProps, SimpleGrid, Space, Stack, Text, Title, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconLanguage } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { ReleaseQuality } from '@/constants/ReleaseQuality';
import { ReleaseSelect } from '@/components/ReleaseSelect/ReleaseSelect';
import Player from '@/components/Player/Player';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';

export interface MovieRelease {
  id: string;
  quality: string;
  audioLangs: string[];
}

interface MoviePageProps {
  releases: { [id: string]: MovieRelease };
  defaultReleaseId: string
}

export default function MoviePage(props: MoviePageProps) {
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
          <ReleaseSelect defaultReleaseId={props.defaultReleaseId} releases={Object.values(props.releases).reduce((a: any, c) => {
            a[c['id']] = { 
              id: c['id'],
              audioLangs: c['audioLangs'].map(l => t(`audioLang.${l}`)),
              quality: ReleaseQuality.fromKey(c['quality'])
            }
            return a
          }, {})} />
          <Space h="xl"/>
          <Player movieTitle={'Movie Title'} m3u8File={'https://default.cdn2.q62.xyz/b8398a81-e744-42a9-a08c-99c7a7add3f2/5e36cab32c958da404c5b7953e55339634f988ee/vod/master.m3u8'}
          backdropImage={'b8398a81-e744-42a9-a08c-99c7a7add3f2/backdropImage.jpg'}  />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
