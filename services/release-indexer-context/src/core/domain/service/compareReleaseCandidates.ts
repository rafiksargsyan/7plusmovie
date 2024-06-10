import { ReleaseCandidate } from "../entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../entity/TorrentReleaseCandidate";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";

export function compareReleaseCandidates(rc1: ReleaseCandidate, rc2: ReleaseCandidate) {
    if (rc1 == null || rc2 == null) throw new NullReleaseCandidateError();
    const rc1RipType = RipType.fromKeyOrThrow(rc1.ripType.key);
    const rc2RipType = RipType.fromKeyOrThrow(rc2.ripType.key);
    if (rc1RipType.isLowQuality() || rc2RipType.isLowQuality()) {
      return RipType.compare(rc1RipType, rc2RipType);
    }
    if (Resolution.compare(rc1.resolution, rc2.resolution) !== 0) {
      return Resolution.compare(rc1.resolution, rc2.resolution);
    }
    if (RipType.compare(rc1.ripType, rc2.ripType) !== 0) {
      return RipType.compare(rc1.ripType, rc2.ripType);  
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
    if (rc1.releaseTimeInMillis != null && rc2.releaseTimeInMillis != null) {
      return rc1.releaseTimeInMillis - rc2.releaseTimeInMillis;
    }
    return 0;
  }

  export class NullReleaseCandidateError extends Error {}