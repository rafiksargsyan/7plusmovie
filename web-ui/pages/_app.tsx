import type { AppProps } from 'next/app'
import '../components/Player.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
