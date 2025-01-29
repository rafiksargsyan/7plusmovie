import { PropsWithChildren } from "react";
import styles from "./IconButton.module.css";

interface IconButtonProps {
  
}

export function IconButton(props: PropsWithChildren<IconButtonProps>) {
  return (
    <button className={styles.root}>{props.children}</button>
  )
}
