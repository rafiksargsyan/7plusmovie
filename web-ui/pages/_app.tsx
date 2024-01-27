import { Box, CircularProgress, createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import { red } from '@mui/material/colors';
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router';
import Script from 'next/script';
import { useEffect, useState } from 'react';
import '../components/plyr-overrides.css';
import { Analytics } from '@vercel/analytics/react';
import { hotjar } from 'react-hotjar';

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
  const router = useRouter();

  useEffect(() => {
    router.beforePopState(() => {
      setLoading(true);
      return true;
    });
    const onRouteChangeStart = (url: string) => {
      if (url.includes("/player?") || url.includes("/tv-show?")) {
        setLoading(true);
      }
    };
    const end = () => {
      setLoading(false);
    };
    router.events.on("routeChangeStart", onRouteChangeStart);
    router.events.on("routeChangeComplete", end);
    router.events.on("routeChangeError", end);
    return () => {
      router.events.off("routeChangeStart", onRouteChangeStart);
      router.events.off("routeChangeComplete", end);
      router.events.off("routeChangeError", end);
    };
  }, [router]);

  useEffect(() => {
    hotjar.initialize(3841658, 6);
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
      <Script
        disable-devtool-auto
        src='https://cdn.jsdelivr.net/npm/disable-devtool@0.3.6'
      />
      <Analytics />
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
