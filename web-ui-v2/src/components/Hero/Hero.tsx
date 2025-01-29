import { Burger } from "@mantine/core";
import { Autocomplete } from "../Autocomplete/Autocomplete";
import { IconButton } from "../IconButton/IconButton";
import { MenuIcon } from "../MenuIcon/MenuIcon";
import styles from "./Hero.module.css";
import { useState } from "react";

interface HeroProps {
  onNavClick: () => void;
  navVisible: boolean;
}

export function Hero(props: HeroProps) {
  return (
    <div className={styles.root}>
      <header className={styles['app-bar']}>
      <Burger opened={props.navVisible} onClick={props.onNavClick} aria-label="Toggle navigation" style={{position: "sticky", top: "0"}}/> 
      </header>
      <img src="./hero-ru-large.jpg"></img>
      <section className={styles.hero}>
        <div style={{ zIndex: "100" }}>
          <h1 style={{ textAlign: "center", marginBottom: "24px", fontSize: "3rem" }}> Good movies are like good books, they are timeless. Our mission is to make the best movies of all time accessible to everyone. </h1>
          <Autocomplete></Autocomplete>
        </div>
      </section>
      {/* <img style={{ objectFit: "none", marginLeft: "50%", transform: "translateX(-50%)" }} src="https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_large.jpg"
      srcSet="https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_large.jpg 2000w, https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_medium.jpg 1279w, https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_small.jpg 959w"
      alt="" aria-hidden="true"></img> */}
    </div>
  )  
}