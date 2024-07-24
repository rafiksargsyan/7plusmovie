import { RipType } from "../domain/value-object/RipType"

export interface ISonarr {
  getAll(tmdbId: string, seasonNumber: number): Promise<SonarrRelease[]>
}

export interface SonarrRelease {
  guid: string
  ripType: RipType
}

export class ISonarrApiError {};
export class ISonarrTvShowNotFoundError {};
