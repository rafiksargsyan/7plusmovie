import { AudioLang } from "./AudioLang";
import { MediaSource } from "./MediaSource";
import { Subtitle } from "./entity/Subtitle";

interface Audio {
  name: string;
  lang: AudioLang;
  channels: number;
  source: MediaSource;
}

export interface Release {
  subtitles: { [key: string]: Subtitle }; // key will also match with labael in MPD or HlS manifest, if subs come from the package
  audios: { [key: string]: Audio }; // key will also match with label in MPD or HlS manifest
  mpdFile: string;
  m3u8File: string;
  thumbnailsFile: string
  releaseIndexerContextId: string | undefined; // This is the id in the release indexer context, if a release is replaced with
                                               // a better release in the context we will replace it also in the main context.
}