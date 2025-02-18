import '@mantine/core/styles.css';
import '@mantine/carousel/styles.css';
import './global.css'
import { ColorSchemeScript, MantineProvider, createTheme } from "@mantine/core";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages} from 'next-intl/server';
import { Metadata } from 'next';

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
