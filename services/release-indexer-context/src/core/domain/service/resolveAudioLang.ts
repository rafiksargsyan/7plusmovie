import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "../value-object/AudioAuthor";
import { AudioLang } from "../value-object/AudioLang";
import { L8nLang } from "../value-object/L8nLang";

export function resolveAudioLang(code: Nullable<string>,
                                 locale: L8nLang,
                                 title: Nullable<string>,
                                 author: Nullable<AudioAuthor>,
                                 numUndefinedAudios: number,
                                 numAudioStreams: number,
                                 radarrLanguages: string[]) {
  if (numUndefinedAudios > 1) return null;
  if (numAudioStreams === 1) {
    if (radarrLanguages.includes("portuguese (brazil)")) return AudioLang.PT_BR;
    if (radarrLanguages.includes("spanish (latino)")) return AudioLang.ES_419;
    if (radarrLanguages.includes("spanish")) return AudioLang.ES;
    if (radarrLanguages.includes("french")) return AudioLang.FR;
    if (radarrLanguages.includes("hindi")) {
      if (locale.lang === "hi") return AudioLang.fromKey(locale.key);
      return AudioLang.HI;
    }
    if (radarrLanguages.includes("english")) {
      if (locale.lang === "en") return AudioLang.fromKey(locale.key);
      return AudioLang.EN;
    }
  }                             
  if (title == null) title = "";
  title = title.toLowerCase();
  let audioLang = AudioLang.fromISO_639_1(code);
  if (audioLang == null) audioLang = AudioLang.fromISO_639_2(code);
  if (AudioLang.equals(audioLang, AudioLang.EN) && locale.lang === "en") {
    const tmp = AudioLang.fromKey(locale.key); // Increasing specifity using locale
    if (tmp != null) return tmp;
  }
  if (AudioLang.equals(audioLang, AudioLang.ES) && (title.includes("latin american") || radarrLanguages.includes("spanish (latino)"))) {
    return AudioLang.ES_419;
  }
  const ruAudioAuthorList = AudioLang.audioAuthorPriorityList[AudioLang.RU.key];
  for (let a of ruAudioAuthorList) {
    if (AudioAuthor.equals(author, a)) return AudioLang.RU;
  }
  return audioLang;
}
