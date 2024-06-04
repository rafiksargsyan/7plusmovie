import { Nullable } from "../../../Nullable";
import { AudioLang } from "../value-object/AudioLang";
import { AudioVoiceType } from "../value-object/AudioVoiceType";
import { L8nLang } from "../value-object/L8nLang";

// Improve the logic by analyzing the movie details from TMDB
export function resolveVoiceType(title: Nullable<string>, lang: AudioLang, locale: L8nLang) {
  if (lang.lang === locale.lang) {
    return AudioVoiceType.ORIGINAL;
  }
  if (title == null) title = "";
  title = title.toLowerCase();
  const dubRegex = /(^dub$)|(^dub[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+dub$)|([^a-zA-Z0-9]dub[^a-zA-Z0-9])/;
  const mvoRegex = /(^mvo$)|(^mvo[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+mvo$)|([^a-zA-Z0-9]mvo[^a-zA-Z0-9])/;
  const dvoRegex = /(^dvo$)|(^dvo[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+dvo$)|([^a-zA-Z0-9]dvo[^a-zA-Z0-9])/;
  const avoRegex = /(^avo$)|(^avo[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+avo$)|([^a-zA-Z0-9]avo[^a-zA-Z0-9])/;
  const voRegex = /(^vo$)|(^vo[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+vo$)|([^a-zA-Z0-9]vo[^a-zA-Z0-9])/;
  const soRegex = /(^so$)|(^so[^a-zA-Z0-9]+)|([^a-zA-Z0-9]+so$)|([^a-zA-Z0-9]so[^a-zA-Z0-9])/;
  if (title.includes("дубляж") || title.includes("дублированный") || title.match(dubRegex) != null) return AudioVoiceType.DUB;
  if (title.match(mvoRegex) != null) return AudioVoiceType.MVO;
  if (title.match(dvoRegex) != null) return AudioVoiceType.DVO;
  if (title.match(avoRegex) != null || title.match(voRegex) != null || title.match(soRegex) != null) return AudioVoiceType.SO;
  if (title.includes("original")) return AudioVoiceType.ORIGINAL;
  return null;
}
