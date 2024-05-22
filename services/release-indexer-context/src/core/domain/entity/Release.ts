import { AudioMetadata } from "../value-object/AudioMetadata";
import { Resolution } from "../value-object/Resolution";
import { RipType } from "../value-object/RipType";
import { SubsMetadata } from "../value-object/SubsMetadata";

export class Release {
  private _audios: AudioMetadata[];
  private _subs: SubsMetadata[];
  private _resolution: Resolution;
  private _ripType: RipType;
}
