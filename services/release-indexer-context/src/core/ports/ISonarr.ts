import { Nullable } from "../../Nullable"
import { Resolution } from "../domain/value-object/Resolution"
import { RipType } from "../domain/value-object/RipType"

export interface ISonarr {
  getAll(tmdbId: string, seasonNumber: number): Promise<SonarrRelease[]>
}

export interface SonarrRelease {
  guid: string
  ripType: RipType
  infoUrl: Nullable<string>
  commentUrl: Nullable<string>
  protocol: string
  seeders: Nullable<number>
  customFormatScore: Nullable<number>
  resolution: Resolution
  age: Nullable<number>
  ageInMinutes: Nullable<number>
  title: string
  downloadUrl: string
  languages: string[]
  indexer: string
}

export class ISonarrApiError {};
export class ISonarrTvShowNotFoundError {};
