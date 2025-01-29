'use client'
import { AppShell, Box, Burger, Group, MantineProvider, Skeleton } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import '@mantine/core/styles.css';
import { MovieCard } from "@/components/MovieCard/MovieCard";
import { Autocomplete } from "@/components/Autocomplete/Autocomplete";

export default function Page() {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <MantineProvider forceColorScheme="dark">
      <AppShell
        navbar={{
          width: 300,
          breakpoint: 'sm',
          collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
        }}
        padding="md"
      >
        <AppShell.Navbar p="md">
          <Group px="md">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          </Group>
        </AppShell.Navbar>
        <AppShell.Main pt={"100px"}>
        <Box component="header" style={{position: "fixed", zIndex: "1", backgroundColor: "black", width: "100%", top: "0"}}>
          <Group justify="right">
          { (mobileOpened || desktopOpened) || (<Group h="100%" px="md">
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="sm" size="sm" />
          </Group>) }
          <Autocomplete></Autocomplete>
          </Group>
        </Box>
        <MovieCard></MovieCard>
        <MovieCard></MovieCard>
        <MovieCard></MovieCard>
        <MovieCard></MovieCard>
        </AppShell.Main>
      </AppShell>
    </MantineProvider>
  );
}
