import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IconButton } from '@mui/material';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import { useState } from 'react';

const L8nTable = {
  EN_US : {
    TURN_OFF_AUDIO: "Turn off audio",
  },
  RU : {
    TURN_OFF_AUDIO: "Выключить звук",
  }
}

interface MenuProps {
  audioTracks: string[] | null;
  currentTrack: number;
  locale: string;
  onAudioTrackSelected: (index: number) => void;
}

export default function AudioTrackSelectionMenu(props: MenuProps) {
  const [currentTrack, setCurrentTrack] = useState(props.currentTrack);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  let audioTracksInternal = [L8nTable[props.locale as keyof typeof L8nTable]['TURN_OFF_AUDIO']];

  if (props.audioTracks != null) {
    audioTracksInternal = audioTracksInternal.concat(props.audioTracks); 
  }

  const handleMenuItemSelected = (index: number) => {
    props.onAudioTrackSelected(index - 1);
    setCurrentTrack(index - 1);
    handleClose();
  } 

  return (
    <>
      <IconButton
        id="volume-button"
        aria-controls={open ? 'audio-track-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="medium">
        {currentTrack == -1 ? <VolumeOffRoundedIcon fontSize="inherit"/> : <VolumeUpRoundedIcon fontSize="inherit"/>}
      </IconButton>
      <Menu
        id="audio-track-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'volume-button',
        }}
      >
        {audioTracksInternal.map((t, i) => (
          <MenuItem key={i} selected={i-1 === currentTrack} onClick={() => handleMenuItemSelected(i)}>
            {t}
          </MenuItem>))}
      </Menu>
    </>
  );
}