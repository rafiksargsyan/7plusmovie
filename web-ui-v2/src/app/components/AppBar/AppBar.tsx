import IconButton from "@mui/material/IconButton";
import { Autocomplete } from "../Autocomplete/Autocomplete";
import MenuIcon from '@mui/icons-material/Menu';
import styles from './AppBar.module.css';
import grey from "@mui/material/colors/grey";

export function AppBar() {
  return (
    <header className={styles.root}>
      <IconButton
        size="large"
        edge="start"
        sx={{ color: "white",  "&:hover": { bgcolor: grey[800] } }}
      >
        <MenuIcon />
      </IconButton>
      <Autocomplete inputPlaceholder="Search" />
    </header>
  )
}
