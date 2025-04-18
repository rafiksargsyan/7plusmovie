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
        <Script id='monetag'>{`(function(s,u,z,p){s.src=u,s.setAttribute('data-zone',z),p.appendChild(s);})(document.createElement('script'),
          'https://paupsoborofoow.net/tag.min.js',9188321,document.body||document.documentElement)`}</Script>
        <Script async id="aclib" type="text/javascript" src="//acscdn.com/script/aclib.js" strategy='beforeInteractive'></Script>
        <Script id="acpop" type="text/javascript" >
          {`aclib.runPop({
            zoneId: '9838474',
          });`}
        </Script>
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
