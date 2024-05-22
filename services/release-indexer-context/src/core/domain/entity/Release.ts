import { AudioMetadata } from "../value-object/AudioMetadata";
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
}
