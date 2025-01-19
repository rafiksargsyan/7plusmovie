'use client'
import { useRef, useState } from "react";
import styles from "./Autocomplete.module.css";
import ClearIcon from '@mui/icons-material/Clear';
import IconButton from "@mui/material/IconButton";
import grey from "@mui/material/colors/grey";

interface AutocompleteProps {
  inputPlaceholder: string;
}

export function Autocomplete(props: AutocompleteProps) {
  const inputRef = useRef(null);
  const clearButtonRef = useRef(null);

  return (
    <div className={styles.root}>
      <input ref={inputRef} className={styles.input} type="text" placeholder={props.inputPlaceholder} onChange={(e) => { (clearButtonRef.current as any).style.display = (e.target.value == "" ? "none" : "flex") }}/>
      <IconButton sx={{ "&:hover": { bgcolor: grey[900] }, display: "none", alignItems: "center" }}
                  ref={clearButtonRef}
                  size="small"
                  onClick={() => { (inputRef.current as any).value = ""; (clearButtonRef.current as any).style.display = "none"; (inputRef.current as any).focus() }}><ClearIcon sx={{ color: grey[400] }} /></IconButton>
    </div>
  )
}
