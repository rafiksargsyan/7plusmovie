export interface ISonarr {
  getAll(tmdbId: string, seasonNumber: number): Promise<SonarrRelease[]>
}

export interface SonarrRelease {
  guid: string
}

export class ISonarrApiError {};
export class ISonarrTvShowNotFoundError {};
