import Head from 'next/head';
import { useRouter } from 'next/router';
import Catalog from '../components/Catalog';

const L8nLangCodes = {
  EN_US : { langTag : "en-US", countryCode: "US" },
  RU : { langTag : "ru", countryCode: "RU" }
} as const;
  
const langTagToLangCode = {
  "en-US" : "EN_US",
  "ru" : "RU"
} as const;

const L8nTable = {
  EN_US : {
    TITLE: "Watch Free Movies Online"
  },
  RU : {
    TITLE: "Смотри бесплатные фильмы онлайн"
  }
}

function CatalogPage() {
  const router = useRouter();
  const currentLocale = router.locale != null ? router.locale : router.defaultLocale!;
  const currentLocaleCode = langTagToLangCode[currentLocale as keyof typeof langTagToLangCode];
  return (
    <> 
      <Head>
        <title>{L8nTable[currentLocaleCode]['TITLE']}</title>
      </Head>
      <Catalog />
    </>
  )  
}

export default CatalogPage;
