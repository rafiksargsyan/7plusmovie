import { ReleaseCandidate } from "../entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../entity/TorrentReleaseCandidate";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";

export function compareReleaseCandidates(rc1: ReleaseCandidate, rc2: ReleaseCandidate) {
    if (rc1 == null || rc2 == null) throw new NullReleaseCandidateError();
    const rc1RipType = RipType.fromKeyOrThrow(rc1.ripType.key);
    const rc2RipType = RipType.fromKeyOrThrow(rc2.ripType.key);
    if (rc1RipType.isLowQuality() || rc2RipType.isLowQuality()) {
      if (RipType.compare(rc1.ripType, rc2.ripType) !== 0) {
        return RipType.compare(rc1.ripType, rc2.ripType);  
      }
    }
    if (Resolution.compare(rc1.resolution, rc2.resolution) !== 0) {
      return Resolution.compare(rc1.resolution, rc2.resolution);
    }
    if (RipType.compare(rc1.ripType, rc2.ripType) !== 0) {
      return RipType.compare(rc1.ripType, rc2.ripType);  
    }
    if (rc1.releaseTimeInMillis != null && rc2.releaseTimeInMillis != null) {
      const d1 = Math.round(rc1.releaseTimeInMillis / (1000 * 60 * 60 * 24));
      const d2 = Math.round(rc2.releaseTimeInMillis / (1000 * 60 * 60 * 24));
      if (d1 != d2) return d1 - d2;
    }
    let rc1Seeders = 0;
    let rc2Seeders = 0;
    if (rc1 instanceof TorrentReleaseCandidate) {
      rc1Seeders = rc1.seeders; 
    }
    if (rc2 instanceof TorrentReleaseCandidate) {
      rc2Seeders = rc2.seeders;
    }
    if (rc1Seeders !== rc2Seeders) {
      return rc1Seeders - rc2Seeders;
    }
    return 0;
  }

  export class NullReleaseCandidateError extends Error {}