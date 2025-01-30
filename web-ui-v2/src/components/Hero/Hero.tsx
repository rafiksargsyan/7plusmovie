import { Box, Button, Container, Overlay, Stack, Title, useMantineTheme } from "@mantine/core";
import styles from "./Hero.module.css"
import { useMediaQuery } from "@mantine/hooks";

export function Hero() {
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);

  return (
    <Box component="section" style={{ overflow: "hidden", position: "relative" }} h={{ base: "50vh", xs: "60vh", sm: "70vh", md: "80vh", lg: "90vh", xl: "90vh" }}>
      <img src="hero-ru-large.jpg" className={styles.img}/>
      <Overlay color="transparent" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.9))" }} />
      <Box pos="absolute" style={{zIndex: 201, top: '0', left: '0', width: "100%", height: "100%"}}>
        <Container size='sm' style={{ height: '100%'}}>
          <Stack justify="center" align="center" style={{ height: '100%'}} pb="60">
            <Title ta="center" order={xsOrSmaller ? 2 : 1} style={{color: "white"}}>Our mission is to make the greatest movies and TV shows of all time accessible to everyone.</Title>
            <Button size="lg">Sign Up</Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )  
}
