import axios from 'axios'
import { Nullable, strIsBlank } from '../../utils'
import { AudioLang } from '../domain/AudioLang'
import { SecretsManager } from '@aws-sdk/client-secrets-manager'

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

interface Param {
  ip: string  
}

interface GeoData {
  countryCode: string
  city: Nullable<string>
}

export const handler = async (event: Param) => {
  const geoData = await resolveGeoData(event.ip)
  return resolveAudioLang(geoData.countryCode, geoData.city)
}

async function resolveGeoData(ip: string) {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId})
  const secret = JSON.parse(secretStr.SecretString!)
  const ipinfoIoToken = secret.IPINFO_IO_TOKEN
  const ipgeolocationIoToken = secret.IPGEOLOCATION_IO_TOKEN
  let ret = await getGeoDataFromIpApiCo(ip)
  if (ret == null) {
    ret = await getGeoDataFromIpInfoIo(ipinfoIoToken, ip)
  }
  if (ret == null) {
    ret = await getGeoDataFromIpGeolocationIo(ipgeolocationIoToken, ip)
  }
  if (ret == null) {
    console.warn(`Failed to retrieve geo data for IP=${ip}, defaulting to RU`)
    ret = {
      countryCode: 'RU',
      city: null
    }
  }
  return ret
}

async function getGeoDataFromIpGeolocationIo(token: string, ip: string) {
  let response
  try {
    response = await axios.get(`https://api.ipgeolocation.io/ipgeo?apiKey=${token}&ip=${ip}`)
  } catch (e) {
    console.warn(`Got error while querying geo data for IP=${ip}, from ipgeolocation.io: ${e.message}`)
    return null
  }
  const countryCode = response?.data?.country_code2
  const city = response?.data?.city
  if (strIsBlank(countryCode)) {
    console.warn(`Country code is blank for IP=${ip} from ipgeolocation.io`)
    return null
  }
  return {
    countryCode: countryCode,
    city: city
  }
}

async function getGeoDataFromIpInfoIo(token: string, ip: string) {
  let response
  try {
    response = await axios.get(`https://ipinfo.io/${ip}?token=${token}`)
  } catch (e) {
    console.warn(`Got error while querying geo data for IP=${ip}, from ipinfo.io: ${e.message}`)
    return null
  }
  const countryCode = response?.data?.country
  const city = response?.data?.city
  if (strIsBlank(countryCode)) {
    console.warn(`Country code is blank for IP=${ip} from ipinfo.io`)
    return null
  }
  return {
    countryCode: countryCode,
    city: city
  }
}

async function getGeoDataFromIpApiCo(ip: string): Promise<Nullable<GeoData>> {
  let response
  try {
    response = await axios.get(`https://ipapi.co/${ip}/json`)
  } catch (e) {
    console.warn(`Got error while querying geo data for IP=${ip}, from ipapi.co: ${e.message}`)
    return null
  }
  const countryCode = response?.data?.country_code
  const city = response?.data?.city
  if (strIsBlank(countryCode)) {
    console.warn(`Country code is blank for IP=${ip} from ipapi.co`)
    return null
  }
  return {
    countryCode: countryCode,
    city: city
  }
}

function resolveAudioLang(countryCode: string, city: Nullable<string>): string {
  switch (countryCode) {
    case 'US': return AudioLang.EN_US.key
    case 'GB': return AudioLang.EN_GB.key
    case 'AM':
    case 'GE':
    case 'KZ':
    case 'RU': return AudioLang.RU.key
    case 'CA': {
      if (city != null && city.toLowerCase().includes('quebec')) return AudioLang.FR_CA.key
      return AudioLang.EN_US.key
    }
    case 'IN': return AudioLang.HI_IN.key
    case 'FR': return AudioLang.FR_FR.key
    case 'ES': return AudioLang.ES.key
    case 'BR': return AudioLang.PT_BR.key
    case 'AU': return AudioLang.EN_AU.key
    case 'PT': return AudioLang.PT.key
    case 'IT': return AudioLang.IT.key
    case 'UA': return AudioLang.UK.key
    case 'MX': return AudioLang.ES_419.key
    default: return AudioLang.RU.key
  }
}
