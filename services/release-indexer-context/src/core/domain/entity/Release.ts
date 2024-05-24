import { AudioAuthor } from "../value-object/AudioAuthor";
import { AudioMetadata } from "../value-object/AudioMetadata";
import { AudioVoiceType } from "../value-object/AudioVoiceType";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { SubsMetadata } from "../value-object/SubsMetadata";

export class Release {
  private _audios: AudioMetadata[];
  private _subs: SubsMetadata[];
  private _resolution: Resolution;
  private _ripType: RipType;

  static compare(r1: Release, r2: Release) {
    if (r1._ripType != r2._ripType) {
      if (r1._ripType === RipType.CAM) return -1;
      if (r2._ripType === RipType.CAM) return 1;
    }
    if (Resolution.compare(r1._resolution, r2._resolution) !== 0) {
      return Resolution.compare(r1._resolution, r2._resolution);
    }
    
  }

  // compare audio streams in the same release. null means the audio streams are not comparable and both must be
  // added. For example, if two streams have different languages both must be added to the final release. 0 means
  // the streams are considered the same. For example, two streams having same voice type (e.g. MVO) and unknown
  // authors. Only one of them will be added to the final release.
  private static compareAudio(a1: AudioMetadata, a2: AudioMetadata) {
    if (a1.lang !== a2.lang) return null;
    let ret = AudioVoiceType.compare(a1.voiceType, a2.voiceType);
    if (ret === 0) {
      if (a1.author == null && a2.author == null) return 0;
      if (a1.author == null && a2.author != null) return -1;
      if (a1.author != null && a2.author == null) return 1;
      const a1AuthorIndex = a1.lang.audioAuthorPriorityList.findIndex((v) => a1.author === v);
      const a2AuthorIndex = a1.lang.audioAuthorPriorityList.findIndex((v) => a2.author === v);
      if (a1AuthorIndex === -1 && a2AuthorIndex === -1) return null;
      ret = a1AuthorIndex - a2AuthorIndex;
    }
    if (a1.voiceType === AudioVoiceType.DUB && a1.author === AudioAuthor.HDREZKA && a2.author === AudioAuthor.LOSTFILM) ret = -1;
    if (a2.voiceType === AudioVoiceType.DUB && a2.author === AudioAuthor.HDREZKA && a1.author === AudioAuthor.LOSTFILM) ret = 1;
    return ret;
  }
}
