import { TorrentTracker } from "../value-object/TorrentTracker";
import { Release } from "./Release";

export class TorrentRelease extends Release {
  private tracker: TorrentTracker;
}