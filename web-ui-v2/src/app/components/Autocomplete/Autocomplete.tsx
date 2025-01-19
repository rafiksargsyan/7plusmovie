'use client'
import { useState } from "react";
import styles from "./Autocomplete.module.css";
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';

interface AutocompleteProps {
  inputPlaceholder: string;
}

export function Autocomplete(props: AutocompleteProps) {
  const [inputText, setInputText] = useState("");

  return (
    <div className={styles.root}>
      <input className={styles.input} type="text" placeholder={props.inputPlaceholder} value={inputText} onChange={(e) => setInputText(e.target.value)}/>
      { inputText == "" || <button onClick={() => setInputText("")} > <CancelRoundedIcon /> </button> }
    </div>
  )
}