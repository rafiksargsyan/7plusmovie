import { ReleaseCandidate } from "../entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../entity/TorrentReleaseCandidate";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";

export function compareReleaseCandidates(rc1: ReleaseCandidate, rc2: ReleaseCandidate) {
    if (rc1 == null || rc2 == null) throw new NullReleaseCandidateError();
    if (RipType.compare(rc1.ripType, rc2.ripType) !== 0) {
      if (RipType.compare(rc1.ripType, RipType.CAM) === 0) return -1;
      if (RipType.compare(rc2.ripType, RipType.CAM) === 0) return 1;
    }
    if (Resolution.compare(rc1.resolution, rc2.resolution) !== 0) {
      return Resolution.compare(rc1.resolution, rc2.resolution);
    }
    if (RipType.compare(rc1.ripType, rc2.ripType) !== 0) {
      return RipType.compare(rc1.ripType, rc2.ripType);  
    }
    const rc1Size = rc1.sizeInBytes;
    const rc2Size = rc2.sizeInBytes;
    let rc1Seeders = 0;
    let rc2Seeders = 0;
    if (rc1 instanceof TorrentReleaseCandidate) {
      rc1Seeders = rc1.seeders; 
    }
    if (rc2 instanceof TorrentReleaseCandidate) {
      rc2Seeders = rc2.seeders;
    }
    if (RipType.compare(rc1.ripType, RipType.BR) === 0) {
      if (rc1Size != null && rc2Size != null) {
        const minSize = Math.min(rc1Size, rc2Size);
        const maxSize = Math.min(rc1Size, rc2Size);
        if (2 * minSize < maxSize) {
          return rc1Size - rc2Size;
        } else {
          if (rc1Seeders !== rc2Seeders) {
            return rc1Seeders - rc2Seeders;
          }
          if (rc1Size !== rc2Size) {
            return rc2Size - rc1Size;
          }
        }
      }
      if (rc1Seeders !== rc2Seeders) {
        return rc1Seeders - rc2Seeders;
      }
    }
    if (rc1.releaseTimeInMillis != null && rc2.releaseTimeInMillis != null) {
      return rc1.releaseTimeInMillis - rc2.releaseTimeInMillis;
    }
    return 0;
  }

  export class NullReleaseCandidateError extends Error {}