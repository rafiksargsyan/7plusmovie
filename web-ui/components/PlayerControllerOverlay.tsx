import { AppBar, Box, IconButton, Slider, Toolbar, Typography } from "@mui/material";
import Forward10RoundedIcon from '@mui/icons-material/Forward10Rounded';
import Replay5RoundedIcon from '@mui/icons-material/Replay5Rounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import PauseCircleRoundedIcon from '@mui/icons-material/PauseCircleRounded';
import FullscreenRoundedIcon from '@mui/icons-material/FullscreenRounded';
import FullscreenExitRoundedIcon from '@mui/icons-material/FullscreenExitRounded';
import { useEffect, useState } from "react";
import AudioTrackSelectionMenu from "./AudioTrackSelectionMenu";
import TextTrackSelectionMenu from "./TextTrackSelectionMenu";

interface PlayerControllerOverlayProps {
  onPlay: () => void;
  onPause: () => void;
  onReplay: (seconds: number) => void;
  onForward: (seconds: number) => void;
  onSeekCompleted: (event: any, newValue: number | number[]) => void;
  onAudioTrackChange: (index: number) => void;
  handleFullScreen: () => void;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isFullScreen: boolean;
  sliderSize: "small" | "medium";
  movieTitle: string;
  audioTracks: string[] | null;
  currentAudioTrack: number;
  locale: string;
//   textTracks: string[] | null;
//   currentTextTrack: number;
//   onTextTrackChange: (index: number) => void;
}

function PlayerControllerOverlay(props: PlayerControllerOverlayProps) {
  const [active, setActive] = useState(true);
  const [currentTime, setCurrentTime] = useState<number>(-1);
  let idleTimeoutId: string | number | NodeJS.Timeout | undefined;

  useEffect(() => {
    const handleActivity = () => {
      clearTimeout(idleTimeoutId);
      setActive(true);
      startTimer();
    }

    const startTimer = () => {
      idleTimeoutId = setTimeout(() => {
        setActive(false); 
      }, 3000);
    }

    document.addEventListener('mousemove', handleActivity);

    startTimer();

    return () => {
      document.removeEventListener("mousemove", handleActivity);
      clearTimeout(idleTimeoutId);
    }
  }, [])

  return (
    <Box display="flex" flexDirection="column" justifyContent="space-between" position="absolute"
         left={0} right={0} bottom={0} top={0} bgcolor="rgba(0, 0, 0, 0.7)"
         sx={{ opacity: active ? 1 : 0,
               transition: 'opacity 0.3s',
               pointerEvents: active ? 'auto' : 'none',}}>
      <AppBar position="static" style={{ background: 'transparent', boxShadow: 'none'}}>
        <Toolbar>
          <Typography noWrap color="text.secondary">{props.movieTitle}</Typography>
          <Box flexGrow={1} display="flex" justifyContent="right" alignItems="center">
            <AudioTrackSelectionMenu audioTracks={props.audioTracks} currentTrack={props.currentAudioTrack} locale={props.locale} onAudioTrackSelected={props.onAudioTrackChange} />
            {/* <TextTrackSelectionMenu textTracks={props.textTracks} currentTrack={props.currentTextTrack} locale={props.locale} onTextTrackSelected={props.onTextTrackChange}/> */}
            <IconButton onClick={props.handleFullScreen} size="medium">
              {props.isFullScreen ? <FullscreenExitRoundedIcon fontSize="inherit"/> : <FullscreenRoundedIcon fontSize="inherit"/>}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box>
        <Toolbar variant="dense">
          <Slider onChange={(event, newValue) => setCurrentTime(newValue as number)} onChangeCommitted={(event, newValue) => { props.onSeekCompleted(event, newValue), setCurrentTime(-1) }} value={currentTime == -1 ? props.currentTime : currentTime} min={0} max={props.duration} size={props.sliderSize} sx={{ ml: 2, mr: 2 }}/>
        </Toolbar>
        <Toolbar>
          <Typography color="text.secondary">{`${new Date((currentTime == -1 ? props.currentTime : currentTime) * 1000).toISOString().slice(11, 19)}/${props.duration == 1000000000 ? "--:--:--" : new Date(props.duration * 1000).toISOString().slice(11, 19)}`}</Typography>
          <Box flexGrow={1} display="flex" justifyContent="center" alignItems="center">
            <IconButton onClick={() => props.onReplay(5)} size="medium">
              <Replay5RoundedIcon fontSize="inherit" />
            </IconButton>

            <IconButton onClick={props.isPlaying ? props.onPause : props.onPlay } size="large">
              {props.isPlaying ? <PauseCircleRoundedIcon fontSize="inherit"/> : <PlayCircleRoundedIcon fontSize="inherit"/>} 
            </IconButton>

            <IconButton onClick={() => props.onForward(10)} size="medium">
              <Forward10RoundedIcon fontSize="inherit"/>
            </IconButton>
          </Box>
        </Toolbar>
      </Box>
    </Box>
  ); 
}

export default PlayerControllerOverlay;
