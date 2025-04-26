import ClientIFrame from "../../components/ClientIFrame/ClientIFrame";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header id="header">
        <div className={styles.appbar}>
          <a href="#header">YAMBED</a>
          <nav className={styles.nav}>
            <ul>
              <li><a href="#api">API</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
        </div>
        <section>
          <h1>YAMBED</h1>
          <p>Yet Another Video Embedding API</p>
        </section>
      </header>
      <main>
        <section id="api">
          <h2>API DOCUMENTATION</h2>
          <article>
            <h3>Movie API</h3>
            <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}movie?tmdbId=278`} width={720} aspectRatio={16 / 9}/>
          </article>
          <article>
            <h3>Tv Show API</h3>
          <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}tv-show?tmdbId=1399&s=1&e=1`} width={720} aspectRatio={16 / 9}/>
          </article>
        </section>
        <section id="contact">Contact</section>
      </main>
      <footer>
        Disclaimer
      </footer>
    </div>
  );
}
