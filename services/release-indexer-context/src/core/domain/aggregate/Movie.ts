import { TorrentRelease } from "../entity/TorrentRelease";

export class Movie {
  private _id: string;
  private _tmdbId: string;
  private _releases: { [releaseId:string]: TorrentRelease };
}