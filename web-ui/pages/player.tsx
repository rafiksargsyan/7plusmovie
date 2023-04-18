import dynamic from 'next/dynamic';
import Head from 'next/head';

const Player = dynamic(import ("../components/Player"), { ssr: false });

const player = () => (
  <>
    <Head>
      <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/controls.css"></link>
      <script async src="https://cdn.jsdelivr.net/npm/shaka-player@4.3.5/dist/shaka-player.ui.js"></script>
    </Head>
    <Player />
  </>
)

export default player
