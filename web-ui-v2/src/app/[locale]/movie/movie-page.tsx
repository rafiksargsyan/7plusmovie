'use client'
import { AppShell, Burger, Container, Group, Space, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { ReleaseQuality } from '@/constants/ReleaseQuality';
import { ReleaseSelect } from '@/components/ReleaseSelect/ReleaseSelect';
import Player from '@/components/Player/Player';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { useSearchParams } from 'next/navigation';
import { Nullable } from '@/types/Nullable';
import AdsterraBanner from '@/components/AdsterraBanner/AdsterraBanner';

export interface MovieStreamInfo {
  id: string;
  releaesId: Nullable<string>;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  backdropImage: string;
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: string;
}

export interface MovieRelease {
  id: string;
  quality: string;
  audioLangs: string[];
}

interface MoviePageProps {
  releases: { [id: string]: MovieRelease };
  defaultReleaseId: string
  movieStreamInfo: MovieStreamInfo
}

export default function MoviePage(props: MoviePageProps) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const pinned = useHeadroom({ fixedAt: 60 });
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const smOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

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
          <ReleaseSelect label={t("releaseSelect.label")} placeholder={t("releaseSelect.label")}
          defaultReleaseId={props.defaultReleaseId} releases={Object.values(props.releases).reduce((a: any, c) => {
            a[c['id']] = { 
              id: c['id'],
              audioLangs: c['audioLangs'].map(l => t(`audioLang.${l}`)),
              quality: ReleaseQuality.fromKey(c['quality'])
            }
            return a
          }, {})}
          onReleaseSelected={(id: string) => {
            const params = new URLSearchParams(queryParams.toString());
            params.set('releaseId', id);
            router.replace(`${pathname}?${params.toString()}`);
          }}/>
          <Space h="xl"/>
          <Player movieTitle={`${props.movieStreamInfo.titleL8ns[Locale.FROM_LANG_TAG[locale].key] || props.movieStreamInfo.titleL8ns['EN_US']} (${props.movieStreamInfo.releaseYear})`}
          m3u8File={props.movieStreamInfo.m3u8File}
          backdropImage={props.movieStreamInfo.backdropImage}
          thumbnailsFile={props.movieStreamInfo.thumbnailsFile}/>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
