import ClientIFrame from "../../components/ClientIFrame/ClientIFrame";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header>
        <a href="/">YAMBED</a>
        <nav>
          <ul>
            <li><a href="#api">API</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>
        <section>
          <h1>YAMBED - Yet Another Video Embedding API</h1>
        </section>
      </header>
      <main>
        <section id="api">API DOCUMENTATION
          <article>Movie Api
            <ClientIFrame src="http://localhost:3000/movie?tmdbId=278" />
          </article>
          <article>TvShow Api</article>
        </section>
        <section id="contact">Contact</section>
      </main>
      <footer>
        Disclaimer
      </footer>
    </div>
  );
}
