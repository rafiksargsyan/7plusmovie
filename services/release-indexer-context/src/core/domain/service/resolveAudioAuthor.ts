import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "../value-object/AudioAuthor";
import { TorrentTracker } from "../value-object/TorrentTracker";

export function resolveAudioAuthor(title: Nullable<string>, tracker: Nullable<TorrentTracker>) {
  if (title == null) return null;
  title = title.toLowerCase();
  const hdrezak18PlusRegex = /hdrezka.*18\+/;
  const viruseProject18PlusRegex = /viruseproject.*18\+/;
  const jaskier18PlusRegex = /jaskier.*18\+/;
  const bravoRecordsGeorgiaRegex = /bravo.*records.*georgia/;
  const readHeadSoundRegex = /read.*head.*sound/;
  const movieDubbingRegex = /movie.*dubbing/;
  if (title.match(hdrezak18PlusRegex) != null) return AudioAuthor.HDREZKA_18PLUS;
  if (title.match(viruseProject18PlusRegex) != null) return AudioAuthor.VIRUSEPROJECT_18PLUS;
  if (title.match(jaskier18PlusRegex) != null) return AudioAuthor.JASKIER_18PLUS;
  if (title.includes("hdrezka")) return AudioAuthor.HDREZKA;
  if (title.includes('viruseproject')) return AudioAuthor.VIRUSEPROJECT;
  if (title.includes('moviedalen')) return AudioAuthor.MOVIE_DALEN;
  if (title.includes('postmodern')) return AudioAuthor.POSTMODERN;
  if (title.includes('tvshows')) return AudioAuthor.TVSHOWS;
  if (title.includes('lostfilm')) return AudioAuthor.LOSTFILM;
  if (title.match(bravoRecordsGeorgiaRegex) != null) return AudioAuthor.BRAVO_RECORDS_GEORGIA;
  if (title.match(readHeadSoundRegex) != null) return AudioAuthor.READ_HEAD_SOUND;
  if (title.match(movieDubbingRegex) != null) return AudioAuthor.MOVIE_DUBBING;
  if (title.includes('кириллица')) return AudioAuthor.KIRILLICA;
  if (title.includes('киномания')) return AudioAuthor.KINOMANIA;
  if (title.includes('1+1')) return AudioAuthor.ONE_PLUS_ONE;
  if (title.includes('ivi')) return AudioAuthor.IVI;
  if (title.includes('jaskier')) return AudioAuthor.JASKIER;
  if (title.includes('кінаконг')) return AudioAuthor.KINAKONG;
  return null;
}