import { Nullable } from "../../../Nullable";
import { Release } from "../entity/Release";
import { ReleaseCandidate } from "../entity/ReleaseCandidate";
import { L8nLang } from "../value-object/L8nLang";

interface Season {
  names: string[];
  tmdbSeasonNumber: Nullable<number>;
  episodes: Episode[];
  seasonNumber: number;
}

interface Episode {
  names: string[];
  releases: { [releaseId:string]: { release: Release, replacedReleaseIds: string[] } }
  tmdbEpisodeNumber: Nullable<number>;
  episodeNumber: number;
  airDateInMillis: Nullable<number>;
  forceScan: boolean;
  blackList: string[];
  whiteList: string[];
  alreadyAddedSonarrReleaseGuidList: string[];
  lastReleaseCandidateScanTimeMillis: number;
  readyToBeProcessed: boolean;
  releaseCandidates: { [key:string]: ReleaseCandidate };
  runtimeSeconds: Nullable<number>;
}

export class TvShow {
  private _id: string;
  private _creationTime: number;
  private _tmdbId: Nullable<string>;
  private _originalLocale: L8nLang;
  private _originalTitle: string;
  private _releaseYear: number;
  private _seasons: Season[];
}