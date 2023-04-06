import dynamic from 'next/dynamic';

const Player = dynamic(import ("../components/Player"), { ssr: false });

const player = () => <Player />

export default player