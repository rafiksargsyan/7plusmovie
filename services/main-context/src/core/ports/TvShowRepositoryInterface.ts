import { TvShow } from "../domain/aggregate/TvShow"

export interface TvShowRepositoryInterface {
  getTvShowById(id: string | undefined) : Promise<TvShow>
  saveTvShow(tvShow: TvShow)
  saveSeason(tvShow: TvShow, saveRoot: boolean, seasonNumber: number)
  getSeason(id: string, seasonNumber: number) : Promise<TvShow>
}
