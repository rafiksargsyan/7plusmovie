import { Nullable } from "../../../Nullable";
import { AudioVoiceType } from "../value-object/AudioVoiceType";
import { TorrentTracker } from "../value-object/TorrentTracker";

// Improve the logic by analyzing the movie details from TMDB
export function resolveVoiceType(title: Nullable<string>, tracker: Nullable<TorrentTracker>, langCode: Nullable<string>) {
  if (title == null) title = "";
  title = title.toLowerCase();
  if (title.includes("дубляж") || title.includes("дублированный") || title.includes("dub")) return AudioVoiceType.DUB;
  if (title.includes("mvo")) return AudioVoiceType.MVO;
  if (title.includes("dvo")) return AudioVoiceType.DVO;
  if (title.includes("avo") || title.includes("vo") || title.includes("so")) return AudioVoiceType.SO;
  if (title.includes("original")) return AudioVoiceType.ORIGINAL;
  if (langCode != null && langCode !== "rus" && langCode !== "ru" &&
      langCode !== "uk" && langCode !== "ukr" && tracker === TorrentTracker.RUTRACKER) {
    return AudioVoiceType.ORIGINAL;
  }
  return null;
}
