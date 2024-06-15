import { AudioAuthor } from "../value-object/AudioAuthor";
import { AudioMetadata } from "../value-object/AudioMetadata";
import { AudioVoiceType } from "../value-object/AudioVoiceType";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { SubsMetadata } from "../value-object/SubsMetadata";
import { AudioLang } from "../value-object/AudioLang";
import { SubsLang } from "../value-object/SubsLang";
import { SubsType } from "../value-object/SubsType";
import { SubsAuthor } from "../value-object/SubsAuthor";
import { Nullable } from "../../../Nullable";

export class Release {
  private _audios: AudioMetadata[] = [];
  private _subs: SubsMetadata[] = [];
  private _resolution: Resolution;
  private _ripType: RipType;
  private _size: number;
  private _hash: string;
  private _mediaFileRelativePath: string;
  private _creationTime;
  private _cachedMediaFileRealativePath;

  public constructor(createEmptyObject: boolean, ripType?: RipType, res?: Resolution, hash?: string,
    mediaFileRelativePath?: string, size?: number) {
    if (!createEmptyObject) {
     this._ripType = this.validateRipType(ripType);
     this._resolution= this.validateResolution(res);
     this._hash = this.validateHash(hash);
     this._mediaFileRelativePath = this.validateMediaFileRelativePath(mediaFileRelativePath);
     this._size = this.validateSize(size);
     this._creationTime = Date.now();
    }
  }

  static compare(r1: Release, r2: Release) {
    let r1Audios = [...r1._audios];
    let r2Audios = [...r2._audios];
    for (let a1 of r1._audios) {
      for (let a2 of r2._audios) {
        const compareResult = Release.compareAudio(a1, a2);
        if (compareResult == null) continue;
        if (compareResult <= 0) {
          r1Audios = r1Audios.filter((v) => v != a1);
        }
        if (compareResult >= 0) {
          r2Audios = r2Audios.filter((v) => v != a2);
        }
      }
    }
    if (r1Audios.length !== 0 && r2Audios.length !== 0) return null;
    if (r1Audios.length === 0 && r2Audios.length === 0)  {
      const r1RipType = RipType.fromKeyOrThrow(r1.ripType.key);
      const r2RipType = RipType.fromKeyOrThrow(r2.ripType.key);
      if (r1RipType.isLowQuality() || r2RipType.isLowQuality()) {
        const compareResult = RipType.compare(r1RipType, r2RipType);
        if (compareResult !== 0) return compareResult;
      }
      if (Resolution.compare(r1._resolution, r2._resolution) !== 0) {
        return Resolution.compare(r1._resolution, r2._resolution);
      }
    }  
    return r1Audios.length - r2Audios.length;
  }

  static compare2(r1: Release, r2: Release) {
    if (Math.abs(r1.creationTime - r2.creationTime) < 7 * 24 * 60 * 60 * 1000) {
      if (RipType.compare(r1._ripType, r2._ripType) === 0) {
        return r2._size - r1._size;
      } else {
        return RipType.compare(r1._ripType, r2._ripType);
      }
    } else {
      return r1.creationTime - r2.creationTime;
    }
  }

  public addAudioMetadata(am: AudioMetadata) {
    if (am == null) {
      throw new NullAudioMetadataError();
    }
    for (let x of this._audios) {
      if (x.stream === am.stream) {
        throw new AudioMetadataWithSameStreamNumberAlreadyExistsError();
      }
      const compareResult = Release.compareAudio(x, am);
      if (compareResult != null && compareResult > 0) {
        return;
      }
    }
    this._audios = this._audios.filter((v) => {
      const compareResult = Release.compareAudio(v, am);
      return compareResult == null;
    });
    this._audios.push(am);
  }

  public addSubsMetadata(sm: SubsMetadata) {
    if (sm == null) {
      throw new NullSubsMetadataError();
    }
    for (let x of this._subs) {
      if (x.stream === sm.stream) {
        throw new SubsMetadataWithSameStreamNumberAlreadyExistsError();
      }
      const compareResult = Release.compareSubs(x, sm);
      if (compareResult != null && compareResult >= 0) {
        return;
      }
    }
    this._subs = this._subs.filter((v) => {
      const compareResult = Release.compareSubs(v, sm);
      return compareResult == null;
    })
    this._subs.push(sm);
  }

  private static compareSubs(s1: SubsMetadata, s2: SubsMetadata) {
    if (!SubsLang.equals(s1.lang, s2.lang) || !SubsType.equals(s1.type, s2.type)) return null;
    let subsAuthorPriorityList = SubsLang.subsAuthorPriorityList[s1.lang.key];
    if (subsAuthorPriorityList == null) subsAuthorPriorityList = [];
    const s1AuthorIndex = subsAuthorPriorityList.findIndex((v) => SubsAuthor.equals(s1.author, v));
    const s2AuthorIndex = subsAuthorPriorityList.findIndex((v) => SubsAuthor.equals(s2.author, v));
    return s1AuthorIndex - s2AuthorIndex;
  }

  // null means the audio streams are not comparable and both must be
  // added. For example, if two streams have different languages both must be added to the final release. 0 means
  // the streams are considered the same. For example, two streams having same voice type (e.g. MVO) and unknown
  // authors. Only one of them will be added to the final release.
  private static compareAudio(a1: AudioMetadata, a2: AudioMetadata) {
    if (!AudioLang.equals(a1.lang, a2.lang)) return null;
    let ret = AudioVoiceType.compare(a1.voiceType, a2.voiceType);
    if (ret === 0) {
      if (a1.author == null && a2.author == null) return 0;
      if (a1.author == null && a2.author != null) return -1;
      if (a1.author != null && a2.author == null) return 1;
      let audioAuthorPriorityList = AudioLang.audioAuthorPriorityList[a1.lang.key];
      if (audioAuthorPriorityList == null) audioAuthorPriorityList = [];
      const a1AuthorIndex = audioAuthorPriorityList.findIndex((v) => AudioAuthor.equals(a1.author, v));
      const a2AuthorIndex = audioAuthorPriorityList.findIndex((v) => AudioAuthor.equals(a2.author, v));
      if (a1AuthorIndex === -1 && a2AuthorIndex === -1) return null;
      ret = a1AuthorIndex - a2AuthorIndex;
    }
    if (AudioVoiceType.compare(a1.voiceType, AudioVoiceType.DUB) &&
        AudioAuthor.equals(a1.author, AudioAuthor.HDREZKA) &&
        AudioAuthor.equals(a2.author, AudioAuthor.LOSTFILM)) ret = -1;
    if (AudioVoiceType.compare(a2.voiceType, AudioVoiceType.DUB) === 0 &&
        AudioAuthor.equals(a2.author, AudioAuthor.HDREZKA) &&
        AudioAuthor.equals(a1.author, AudioAuthor.LOSTFILM)) ret = 1;
    return ret;
  }

  private validateRipType(ripType: Nullable<RipType>) {
    if (ripType == null) {
      throw new NullRipTypError();
    }
    return ripType;
  }

  private validateResolution(res: Nullable<Resolution>) {
    if (res == null) {
      throw new NullResolutionError();
    }
    return res;
  }

  private validateMediaFileRelativePath(path: Nullable<string>) {
    if (path == null || path.trim() === "") {
      throw new InvalidMediaFilePathError();
    }
    return path;
  }

  private validateHash(hash: Nullable<string>) {
    if (hash == null) {
      throw new NullHashError();
    }
    return hash;
  }

  private validateSize(size: Nullable<number>) {
    if (size == null || size < 0) {
      throw new InvalidSizeError();
    }
    return size;
  }

  set cachedMediaFileRelativePath(path: string) {
    if (path == null || path.trim() === "") {
      throw new EmptyPathError();
    }
    this._cachedMediaFileRealativePath = path;
  }
  
  get cachedMediaFileRelativePath() {
    return this._cachedMediaFileRealativePath;
  }

  get hash() {
    return this._hash;
  }

  get creationTime() {
    return this._creationTime;
  }

  get ripType() {
    return this._ripType;
  }

  get audios() {
    return this._audios;
  }
}

export class NullRipTypError extends Error {}

export class NullResolutionError extends Error {}

export class NullAudioMetadataError extends Error {}

export class AudioMetadataWithSameStreamNumberAlreadyExistsError extends Error {}

export class NullSubsMetadataError extends Error {}

export class SubsMetadataWithSameStreamNumberAlreadyExistsError extends Error {}

export class NullHashError extends Error {}

export class InvalidMediaFilePathError extends Error {}

export class InvalidSizeError extends Error {}

export class EmptyPathError extends Error {}
