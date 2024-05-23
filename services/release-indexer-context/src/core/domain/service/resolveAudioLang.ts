import { Nullable } from "../../../Nullable";
import { AudioLang } from "../value-object/AudioLang";

// The language resolution logic is currently based on subs language code (2 or 3 letter).
// We might need to improve the logic by adding other parameters (e.g. TMDB id, torrent tracker, etc.).
// Let's say the code is 'eng'. Is it British English or American English? We could make a guess by
// analyzing the movie details from TMDB.
export function resolveAudioLang(code: Nullable<string>) {
  let audioLang = AudioLang.fromISO_639_1(code);
  if (audioLang == null) audioLang = audioLang.fromISO_639_2(code);
  return audioLang;
}
