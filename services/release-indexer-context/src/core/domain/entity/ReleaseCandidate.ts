import { Nullable } from "../../../Nullable";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";

export class ReleaseCandidate {
  private _releaseTimeInMillis: Nullable<number>; 
  private _sizeInBytes: Nullable<number>;
  private _resolution: Resolution;
  private _ripType: RipType;
  private _status: Nullable<ReleaseCandidateStatus>;

  public constructor(createEmptyObject: boolean, releaseTime?: Nullable<number>,
    sizeInBytes?: Nullable<number>, res?: Resolution, ripType?: RipType) {
    if (!createEmptyObject) {
      this._releaseTimeInMillis = this.validateReleaseTime(releaseTime);
      this._sizeInBytes = this.validateSizeInBytes(sizeInBytes);
      this._resolution = this.validateResolution(res);
      this._ripType = this.validateRipType(ripType);
    }
  }

  private validateResolution(res: Nullable<Resolution>) {
    if (res == null) {
      throw new NullResolutionError();
    }
    return res;
  }

  private validateRipType(ripType: Nullable<RipType>) {
    if (ripType == null) {
      throw new NullRipTypeError();
    }
    return ripType;
  }

  private validateSizeInBytes(sizeInBytes: Nullable<number>) {
    if (sizeInBytes != null && sizeInBytes < 0) {
      throw new InvalidSizeInBytesError();
    }
    return sizeInBytes == null ? null : Math.round(sizeInBytes);
  }

  private validateReleaseTime(releaseTime: Nullable<number>) {
    if (releaseTime != null && (releaseTime < 0 || releaseTime > Date.now())) {
      throw new InvalidReleaseTimeError();
    }
    return releaseTime == null ? null : Math.round(releaseTime);
  }

  set status(status: ReleaseCandidateStatus) {
    if (status == null) {
      throw new NullReleaseCandidateStatusError();
    }
    this._status = status;
  }

  get status(): Nullable<ReleaseCandidateStatus> {
    return this._status;
  }

  public static compare(rc1: ReleaseCandidate, rc2: ReleaseCandidate) {
    if (rc1 == null || rc2 == null) throw new NullReleaseCandidateError();
    if (rc1._ripType != rc2._ripType) {
      if (rc1._ripType === RipType.CAM) return -1;
      if (rc2._ripType === RipType.CAM) return 1;
    }
    if (Resolution.compare(rc1._resolution, rc2._resolution) !== 0) {
      return Resolution.compare(rc1._resolution, rc2._resolution);
    }
    if (rc1._ripType != rc2._ripType) {
      return RipType.compare(rc1._ripType, rc2._ripType);  
    }
    if (rc1._sizeInBytes != null && rc2._sizeInBytes != null) {
      return rc2._sizeInBytes - rc1._sizeInBytes;
    }
    if (rc1._releaseTimeInMillis != null && rc2._releaseTimeInMillis != null) {
      return rc1._releaseTimeInMillis - rc2._releaseTimeInMillis;
    }
    return 0;
  }
}

export class ReleaseCandidateStatus {
  public static readonly PROMOTED = new ReleaseCandidateStatus("PROMOTED");
  public static readonly PROCESSED = new ReleaseCandidateStatus("PROCESSED");

  public readonly key;

  private constructor(key: string) {
    this.key = key;
  }

  static fromKeyOrThrow(key: string): ReleaseCandidateStatus {
    if (key == null || ReleaseCandidateStatus[key] == null) {
      throw new InvalidReleaseCandidateStatusKeyError();
    }
    return ReleaseCandidateStatus[key];
  }

  static fromKey(key: Nullable<string>): Nullable<ReleaseCandidateStatus> {
    if (key == null) return null;
    return ReleaseCandidateStatus[key];
  }

  static equals(rc1: Nullable<ReleaseCandidateStatus>, rc2: Nullable<ReleaseCandidateStatus>) {
    return this.fromKey(rc1?.key) == this.fromKey(rc2?.key);
  }
}
  
export class InvalidReleaseCandidateStatusKeyError extends Error {}

export class InvalidReleaseTimeError extends Error {}

export class InvalidSizeInBytesError extends Error {}

export class NullResolutionError extends Error {}

export class NullRipTypeError extends Error {}

export class NullReleaseCandidateStatusError extends Error {}

export class NullReleaseCandidateError extends Error {}
