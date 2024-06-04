import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "../value-object/AudioAuthor";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveAudioAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;
  title = title.toLowerCase();
  if (TorrentTracker.equals(tracker, TorrentTracker.RUTRACKER)) {
    if (title.includes("hdrezka")) return AudioAuthor.HDREZKA;
    if (title.includes("tvshows")) return AudioAuthor.TVSHOWS;
    if (title.includes("lost film")) return AudioAuthor.LOSTFILM;
  }
  return null;
}