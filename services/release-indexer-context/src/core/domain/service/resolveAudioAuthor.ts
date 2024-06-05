import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "../value-object/AudioAuthor";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveAudioAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;
  title = title.toLowerCase();
  if (TorrentTracker.equals(tracker, TorrentTracker.RUTRACKER) || TorrentTracker.equals(tracker, TorrentTracker.RUTOR)) {
    const hdrezak18PlusRegex = /hdrezka.*18\+/;
    const viruseProject18PlusRegex = /viruseproject.*18\+/;
    if (title.match(hdrezak18PlusRegex) != null) return AudioAuthor.HDREZKA_18PLUS;
    if (title.match(viruseProject18PlusRegex) != null) return AudioAuthor.VIRUSEPROJECT_18PLUS;
    if (title.includes("hdrezka")) return AudioAuthor.HDREZKA;
    if (title.includes('viruseproject')) return AudioAuthor.VIRUSEPROJECT;
    if (title.includes('moviedalen')) return AudioAuthor.MOVIE_DALEN;
    if (title.includes('postmodern')) return AudioAuthor.POSTMODERN;
  }
  return null;
}