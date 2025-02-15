import { Locale } from "@/i18n/routing";
import { Metadata, ResolvingMetadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
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
      canonical: '/movies',
      languages: Object.keys(Locale.FROM_LANG_TAG).reduce((a: {[key:string]: string}, c) => { a[c] = `/${c}/movies`; return a; }, {})
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

export default function MoviesPageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}