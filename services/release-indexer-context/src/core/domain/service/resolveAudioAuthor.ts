import { Nullable } from "../../../Nullable";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveAudioAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;  
  if (title.toLowerCase().includes("hdrezka")) return this.HDREZKA;
  if (title.toLowerCase().includes("tvshows")) return this.TVSHOWS;
  if (title.toLowerCase().includes("lost film")) return this.LOSTFILM;
}