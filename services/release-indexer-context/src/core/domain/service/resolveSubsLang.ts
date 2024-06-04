import { Nullable } from "../../../Nullable";
import { L8nLang } from "../value-object/L8nLang";
import { SubsLang } from "../value-object/SubsLang";

// The language resolution logic is currently based on subs title and language code (2 or 3 letter).
// We might need to improve the logic by adding other parameters (e.g. TMDB id, torrent tracker, etc.).
// Let's say the code is 'eng'. Is it British English or American English? We could make a guess by
// analyzing the movie details from TMDB.
export function resolveSubsLang(title: Nullable<string>, code: Nullable<string>, locale: L8nLang) {
  if (title == null) title = "";
  title = title.toLowerCase();
  let subsLang = SubsLang.fromISO_639_1(code);
  if (subsLang == null) subsLang = subsLang.fromISO_639_2(code);
  if (SubsLang.equals(subsLang, SubsLang.EN) && locale.lang === "en") {
    const tmp = SubsLang.fromKey(locale.key); // Increasing specifity using locale
    if (tmp != null) return tmp;
  }
  if (SubsLang.equals(subsLang, SubsLang.ES) && title.includes("latin american")) {
    return SubsLang.ES_419;
  }
  return subsLang;
}