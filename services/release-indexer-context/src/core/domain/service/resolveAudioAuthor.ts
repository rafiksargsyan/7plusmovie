import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "../value-object/AudioAuthor";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveAudioAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;  
  if (title.toLowerCase().includes("hdrezka")) return AudioAuthor.HDREZKA;
  if (title.toLowerCase().includes("tvshows")) return AudioAuthor.TVSHOWS;
  if (title.toLowerCase().includes("lost film")) return AudioAuthor.LOSTFILM;
}