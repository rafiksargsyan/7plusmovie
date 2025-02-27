'use client'
import { AppShell, Burger, Container, Group, Space, UnstyledButton, useMantineTheme } from '@mantine/core';
import { useDisclosure, useHeadroom, useMediaQuery } from '@mantine/hooks';
import { useLocale, useTranslations } from 'next-intl';
import { Link, Locale, usePathname, useRouter } from '@/i18n/routing';
import { ReleaseSelect } from '@/components/ReleaseSelect/ReleaseSelect';
import Player from '@/components/Player/Player';
import { LocaleSelectButton } from '@/components/LocaleSelectButton/LocaleSelectButton';
import { useSearchParams } from 'next/navigation';
import { SeasonSelect } from '@/components/SeasonSelect/SeasonSelect';
import { EpisodeSelect } from '@/components/EpisodeSelect/EpisodeSelect';
import AdsterraBanner from '@/components/AdsterraBanner/AdsterraBanner';

export function getDefaultReleaseId(seasons: Season[], season: number, episode: number) {
  return seasons.filter((s) => s.seasonNumber === season)[0].episodes.filter((e) => e.episodeNumber === episode)[0].defaultReleaseId;
}

export interface Release {
  id: string;
  audioLangs: string[]; 
}

export interface Episode {
  episodeNumber: number;
  nameL8ns: { [key: string]: string };
  releases: { [key: string]: Release };
  stillImge: string;
  defaultReleaseId: string;
}

export interface Season {
  nameL8ns: { [key: string]: string };
  seasonNumber: number;
  episodes: Episode[];
}

interface TvShowPageProps {
  titleL8ns: { [key: string]: string };
  releaseYear: number;
  currentSeasonNumber: number;
  currentEpisodeNumber: number;
  currentReleaseId: string;
  seasons: Season[];
  player: {
    backdropImage: string;
    mpdFile: string;
    m3u8File: string;
    thumbnailsFile: string;
  }
}

function getEpisode(seasons: Season[], seasonNumber: number, episodeNumber: number) {
  return seasons.filter((s) => s.seasonNumber === seasonNumber)[0].episodes.filter((e) => e.episodeNumber === episodeNumber)[0];  
}

export default function TvShowPage(props: TvShowPageProps) {
  const [opened, { toggle }] = useDisclosure();
  const t = useTranslations();
  const locale = useLocale();
  const localeKey = Locale.FROM_LANG_TAG[locale].key;
  const router = useRouter();
  const pathname = usePathname();
  const queryParams = useSearchParams();
  const episode = getEpisode(props.seasons, props.currentSeasonNumber, props.currentEpisodeNumber);
  const defaultSeasonName = t('season', {seasonNumber: props.currentSeasonNumber});
  const defaultEpisodeName = t('episode', {episodeNumber: props.currentEpisodeNumber});
  let playerTitle = `${defaultSeasonName} • ${defaultEpisodeName}`;
  if (localeKey in episode.nameL8ns && episode.nameL8ns[localeKey] != defaultEpisodeName) {
    playerTitle += ` (${episode.nameL8ns[localeKey]})`;
  }
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
          <SeasonSelect label={t("seasonSelect.label")} placeholder={t("seasonSelect.label")} defaultSeasonNumber={props.currentSeasonNumber}
          seasons={props.seasons.map((s) => ({
            seasonNumber: s.seasonNumber,
            seasonName: t('season', {seasonNumber: s.seasonNumber})
          }))}
            onSeasonSelected={function (seasonNumber: number): void {
              const params = new URLSearchParams(queryParams.toString());
              params.set('s', `${seasonNumber}`);
              params.set('e', '1');
              params.set('releaseId', getDefaultReleaseId(props.seasons, seasonNumber, 1))
              router.replace(`${pathname}?${params.toString()}`);
          }}/>
          <EpisodeSelect label={t("episodeSelect.label")} placeholder={t("episodeSelect.label")} defaultEpisodeNumber={props.currentEpisodeNumber}
          episodes={props.seasons.filter((s) => s.seasonNumber === props.currentSeasonNumber)[0].episodes.map((e) => ({
            episodeNumber: e.episodeNumber,
            episodeName: t('episode', {episodeNumber: e.episodeNumber}) + (localeKey in e.nameL8ns && e.nameL8ns[localeKey] != t('episode', {episodeNumber: e.episodeNumber}) ? ` (${e.nameL8ns[localeKey]})` : "")
          }))}
          onEpisodeSelected={function (episodeNumber: number): void {
            const params = new URLSearchParams(queryParams.toString());
              params.set('e', `${episodeNumber}`);
              params.set('releaseId', getDefaultReleaseId(props.seasons, props.currentSeasonNumber, episodeNumber))
              router.replace(`${pathname}?${params.toString()}`);        
            } }/>  
          <ReleaseSelect label={t("releaseSelect.label")} placeholder={t("releaseSelect.label")} releaseId={props.currentReleaseId}
           defaultReleaseId={props.currentReleaseId} releases={Object.values(getEpisode(props.seasons, props.currentSeasonNumber, props.currentEpisodeNumber).releases).reduce((a: any, c) => {
            a[c['id']] = { 
              id: c['id'],
              audioLangs: c['audioLangs'].map(l => t(`audioLang.${l}`)),
            }
            return a
          }, {})}
          onReleaseSelected={(id: string) => {
            const params = new URLSearchParams(queryParams.toString());
            params.set('releaseId', id);
            router.replace(`${pathname}?${params.toString()}`);
          }}/>
          <Space h="xl"/>
          <Player movieTitle={playerTitle} m3u8File={props.player.m3u8File} backdropImage={props.player.backdropImage} thumbnailsFile={props.player.thumbnailsFile}/>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}