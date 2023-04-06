import dynamic from 'next/dynamic';

const Player = dynamic(import ("./components/Player"), { ssr: false });

const PlayerComponent = () => <Player />

export default PlayerComponent
