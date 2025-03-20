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
        <Script async data-cfasync="false" id="rollerads-push">
          {`(function() {
              const url = new URL(window.location.href);
              const clickID = url.searchParams.get("click_id");
              const sourceID = url.searchParams.get("source_id");
        
              const s = document.createElement("script");
              s.dataset.cfasync = "false";
              s.src = "https://push-sdk.com/f/sdk.js?z=1492986";
              s.onload = (opts) => {
                  opts.zoneID = 1492986;
                  opts.extClickID = clickID;
                  opts.subID1 = sourceID;
                  opts.actions.onPermissionGranted = () => {};
                  opts.actions.onPermissionDenied = () => {};
                  opts.actions.onAlreadySubscribed = () => {};
                  opts.actions.onError = () => {};
              };
              document.head.appendChild(s);
            })()`}
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
