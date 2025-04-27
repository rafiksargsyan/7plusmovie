import ClientIFrame from "../../components/ClientIFrame/ClientIFrame";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <header id="header">
        <div className={styles.appbar}>
          <a className={styles.logo} href="#header">YAMBED</a>
          <nav className={styles.nav}>
            <ul>
              <li><a href="#api">API</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </nav>
        </div>
        <div className="sharethis-inline-share-buttons"></div>
        <section className={styles.hero}>
          <h1>YAMBED</h1>
          <p>Yet Another Video Embedding API</p>
        </section>
      </header>
      <div className={styles.container}>
        <main>
          <section id="api">
            <section>
            <h2>API Overview</h2>
              <p><b>YAMBED</b> acts as a stream aggregator. We don&quot;t save any data in our servers. Rather we scrape the Internet and aggregate streams from
                 third party non-affiliates. This means for the same movie we can have multiple streams, possibly with multiple languages. Most of the movies
                 are available in English and Russian audios, but other languages are also possible. Popular ones are Spanish, Italian, French, Hindi, Ukrainian.
                 We provide <code>preferredAudioLang</code> query param so that the client can specify which audio language it is interested in. <em>Please note,
                 this doesn&quot;t guarranty that the audio language is available nor it guarranties that default language for the player will be the one provided by the
                 query param. It just tells the API to prefer a stream which also has the audio language if any.</em>We support TMDB and IMDB ids for movies. For TV
                 shows we also support TVDB id.</p>
            </section>
            <section>
              <h3>Movie API Examples</h3>
              <ol>
                <li>Example using TMDB id: <code>{`${process.env.NEXT_PUBLIC_BASE_URL}movie?tmdbId=278`}</code><br/>
                  <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}movie?tmdbId=278`} width={720} aspectRatio={16 / 9}/></li>
                <li>Example using IMDB id: <code>{`${process.env.NEXT_PUBLIC_BASE_URL}movie?imdbId=tt0111161`}</code><br/>
                  <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}movie?imdbId=tt0111161`} width={720} aspectRatio={16 / 9}/></li>
                <li>Example using <code>preferredAudioLang</code>: <code>{`${process.env.NEXT_PUBLIC_BASE_URL}movie?tmdbId=786892&preferredAudioLang=pt-BR`}</code><br/>
                  <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}movie?tmdbId=786892&preferredAudioLang=pt-BR`} width={720} aspectRatio={16 / 9}/></li>    
              </ol>
            </section>
            <section>
              <h3>Tv Show API Examples</h3>
              <ol>
              <li>Example using TVDB id: <code>{`${process.env.NEXT_PUBLIC_BASE_URL}tv-show?tvdbId=121361&s=1&e=1`}</code><br/>
                <ClientIFrame src={`${process.env.NEXT_PUBLIC_BASE_URL}tv-show?tvdbId=121361&s=1&e=1`} width={720} aspectRatio={16 / 9}/></li>
              </ol>
            </section>
          </section>
          <section id="contact">
            <h2>Contact</h2>
            <a href="mailto:tracenoon@gmail.com">tracenoon@gmail.com</a>
          </section>
        </main>
      </div>
    </div>
  );
}
