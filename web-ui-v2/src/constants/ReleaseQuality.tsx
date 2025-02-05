import { Nullable } from "@/types/Nullable";

export class ReleaseQuality {
  static readonly CAM = new ReleaseQuality("CAM", 0);
  static readonly TELESYNC = new ReleaseQuality("TELESYNC", 1);
  static readonly SD = new ReleaseQuality("SD", 2);
  static readonly HD = new ReleaseQuality("HD", 3);
  static readonly FHD = new ReleaseQuality("FHD", 4);
  
  readonly key: string;
  readonly priority: number;
  
  private constructor(key: string, priority: number) {
    this.key = key;
    this.priority = priority;
  }

  static fromKey(key: Nullable<string>): Nullable<ReleaseQuality> {
    if (key == null) return null;
    return ReleaseQuality[key];
  }
  
  static compare(r1: Nullable<ReleaseQuality>, r2: Nullable<ReleaseQuality>) {
    if (r1 == null && r2 != null) return -1;
    if (r1 != null && r2 == null) return 1;
    if (r1?.key == r2?.key) return 0;
    return (r1 as ReleaseQuality).priority - (r2 as ReleaseQuality).priority;
  }
}
