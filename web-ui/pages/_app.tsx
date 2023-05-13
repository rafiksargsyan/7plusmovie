import { Box, CircularProgress, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { red } from '@mui/material/colors';
import type { AppProps } from 'next/app'
import { Router } from 'next/router';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import '../components/Player.css'

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: red[600],
    }
  },
});

export default function App({ Component, pageProps }: AppProps) {
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const start = () => {
      setLoading(true);
    };
    const end = () => {
      setLoading(false);
    };
    Router.events.on("routeChangeStart", start);
    Router.events.on("routeChangeComplete", end);
    Router.events.on("routeChangeError", end);
    return () => {
      Router.events.off("routeChangeStart", start);
      Router.events.off("routeChangeComplete", end);
      Router.events.off("routeChangeError", end);
    };
  }, []);
  return (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-9F6DBJPMHW"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-9F6DBJPMHW');
        `}
      </Script>
      {loading ? (
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <Box sx={{
                 position: 'fixed',
                 top: 0,
                 left: 0,
                 width: '100%',
                 height: '100%',
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
               }}>
            <CircularProgress />
          </Box>    
        </ThemeProvider>
      ) : (
        <Component {...pageProps} />
      )}
    </>
  );
}
