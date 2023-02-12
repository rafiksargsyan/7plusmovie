import dynamic from 'next/dynamic';

const Player=dynamic(import ("./components/Player"),{ssr:false});

export default function Home() {
  return (
    <Player />
  )
}
