import { Box, Button, Container, Overlay, Stack, Title, useMantineTheme } from "@mantine/core";
import styles from "./Hero.module.css"
import { useMediaQuery } from "@mantine/hooks";
import { useLocale, useTranslations } from "next-intl";

interface HeroProps {
  title: string;
}

export function Hero(props: HeroProps) {
  const theme = useMantineTheme();
  const xsOrSmaller = useMediaQuery(`(max-width: ${theme.breakpoints.xs})`);
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Box component="section" style={{ overflow: "hidden", position: "relative" }} h={{ base: "50vh", xs: "60vh", sm: "70vh", md: "80vh", lg: "90vh", xl: "90vh" }}>
      <img alt={t("hero.image.alt")} src={`hero-${locale}.jpg`} className={styles.img}/>
      <Overlay zIndex={0} color="transparent" style={{ backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.8))" }} />
      <Box pos="absolute" style={{zIndex: 1, top: '0', left: '0', width: "100%", height: "100%"}}>
        <Container size='sm' style={{ height: '100%'}}>
          <Stack justify="center" align="center" style={{ height: '100%'}} pb="60">
            <Title ta="center" order={xsOrSmaller ? 2 : 1} style={{color: "white"}}>{props.title}</Title>
            <Button size="lg">{t("signup")}</Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  )  
}
