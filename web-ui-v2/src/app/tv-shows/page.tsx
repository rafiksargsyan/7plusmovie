'use client'
import { AppShell, Burger, Group, MantineProvider, Skeleton, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import '@mantine/core/styles.css';

export default function Page() {
  const [opened, { toggle }] = useDisclosure();

  return (
    <MantineProvider forceColorScheme='dark'>
    <AppShell
      layout="alt"
      header={{ height: 60 }}
      navbar={{ width: 300, collapsed: { mobile: !opened, desktop: !opened }, breakpoint: "sm" }}
      padding="md"
    >
      <AppShell.Header style={{backgroundColor: "black"}}>
        <Group h="100%" px="md">
          {opened || <Burger opened={false} onClick={toggle} size="sm" />}

        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md" style={{backgroundColor: 'black'}}>
        <Group>
          {opened && <Burger opened={false} onClick={toggle}  size="sm" /> }
        </Group>
        {Array(15)
          .fill(0)
          .map((_, index) => (
            <Skeleton key={index} h={28} mt="sm" animate={false} />
          ))}
      </AppShell.Navbar>
      <AppShell.Main style={{backgroundColor: 'black'}}>
        Alt layout – Navbar and Aside are rendered on top on Header and Footer
      </AppShell.Main>
    </AppShell>
    </MantineProvider>
  );
}
