import { Nullable } from "../../../Nullable";
import { SubsLang } from "../value-object/SubsLang";

// The language resolution logic is currently based on subs title and language code (2 or 3 letter).
// We might need to improve the logic by adding other parameters (e.g. TMDB id, torrent tracker, etc.).
// Let's say the code is 'eng'. Is it British English or American English? We could make a guess by
// analyzing the movie details from TMDB.
export function resolveSubsLang(title: Nullable<string>, code: Nullable<string>) {
  let subsLang = SubsLang.fromISO_639_1(code);
  if (subsLang == null) subsLang = SubsLang.fromISO_639_2(code);
  title = title?.toLowerCase();
  if (title?.includes("latin american")) subsLang = SubsLang.ES_419;
  return subsLang;
}