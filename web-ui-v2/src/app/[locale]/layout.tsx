import { Locale } from "@/i18n/routing";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Script from "next/script";

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata(
  { params }: Props
): Promise<Metadata> {
  const locale = (await params).locale;
  const t = await getTranslations({locale, namespace: 'Metadata'});

  return {
    title: t('home.title'),
    description: t('home.description'),
    openGraph: {
      title: t('home.title'),
      description: t('home.description'),
      images: '/ogImage.jpg',
    },
    alternates: {
      canonical: '/',
      languages: Object.keys(Locale.FROM_LANG_TAG).reduce((a: {[key:string]: string}, c) => { a[c] = `/${c}`; return a; }, {})
    },
    icons: {
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      icon: [
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      ]
    },
    manifest: '/site.webmanifest'
  }
}

export default function HomePageLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
      <Script async={true} data-cfasync="false" src="//pl25728000.effectiveratecpm.com/896becda8e20a6d0e0feb77cc7e72f11/invoke.js">
      </Script>
      {children}
    </>)
}