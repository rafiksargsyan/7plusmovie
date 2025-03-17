import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import './global.css'
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages} from 'next-intl/server';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.q62.xyz'),
}

const theme = createTheme({
  primaryColor: "violet",
  components: {
    Button: {
      defaultProps: {
        radius: 'xl'
      },
    }
  }
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <Script async type="text/javascript" src="https://s0-greate.net/p/1494520"></Script>
        <Script id="hydro_config" type="text/javascript">
          {`window.Hydro_tagId = "eb4924a1-00e7-48a5-aa73-bd8c9314a726";`}
        </Script>
        <Script id="hydro_script" src="https://track.hydro.online/"></Script>
      </head>
      <body data-theme="dark">
        <MantineProvider theme={theme} defaultColorScheme="dark" forceColorScheme='dark'>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </MantineProvider>
      </body>
    </html> 
  );
}
