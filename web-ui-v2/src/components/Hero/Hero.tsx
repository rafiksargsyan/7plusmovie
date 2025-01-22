import { AppBar } from "../AppBar/AppBar";

export function Hero() {
  return (
    <header>
      <AppBar></AppBar>
      <img style={{ objectFit: "none", marginLeft: "50%", transform: "translateX(-50%)" }} src="https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_large.jpg" srcSet="https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_large.jpg 2000w, https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_medium.jpg 1279w, https://assets.nflxext.com/ffe/siteui/vlv3/e3e9c31f-aa15-4a8f-8059-04f01e6b8629/web/AM-ru-20250113-TRIFECTA-perspective_d6367bcc-a67b-4f04-a2e1-7ab08e02428a_small.jpg 959w" alt="" aria-hidden="true"></img>
    </header>
  )  
}