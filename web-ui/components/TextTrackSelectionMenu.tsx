import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { IconButton } from '@mui/material';
import SubtitlesOffRoundedIcon from '@mui/icons-material/SubtitlesOffRounded';
import SubtitlesRoundedIcon from '@mui/icons-material/SubtitlesRounded';
import { useState } from 'react';

const L8nTable = {
  EN_US : {
    TURN_OFF_SUBS: "Turn off subtitles",
  },
  RU : {
    TURN_OFF_SUBS: "Выключить субтитры",
  }
}

interface MenuProps {
  textTracks: string[] | null;
  currentTrack: number;
  locale: string;
  onTextTrackSelected: (index: number) => void;
}

export default function TextTrackSelectionMenu(props: MenuProps) {
  const [currentTrack, setCurrentTrack] = useState(props.currentTrack);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  let textTracksInternal = [L8nTable[props.locale as keyof typeof L8nTable]['TURN_OFF_SUBS']];

  if (props.textTracks != null) {
    textTracksInternal = textTracksInternal.concat(props.textTracks); 
  }

  const handleMenuItemSelected = (index: number) => {
    props.onTextTrackSelected(index - 1);
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
        {currentTrack == -1 ? <SubtitlesOffRoundedIcon fontSize="inherit"/> : <SubtitlesRoundedIcon fontSize="inherit"/>}
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
        {textTracksInternal.map((t, i) => (
          <MenuItem key={i} selected={i-1 === currentTrack} onClick={() => handleMenuItemSelected(i)}>
            {t}
          </MenuItem>))}
      </Menu>
    </>
  );
}