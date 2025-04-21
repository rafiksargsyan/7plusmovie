import { Nullable } from "../../utils"
import { TvShow } from "../domain/aggregate/TvShow"

export interface TvShowRepositoryInterface {
  getTvShowById(id: string | undefined) : Promise<TvShow>
  findTvShowByTvdbId(id: number) : Promise<string>
  findTvShowByTmdbId(id: number) : Promise<string>
  findTvShowByImdbId(id: string) : Promise<string>
  getByIdLazy(id: Nullable<string>) : Promise<TvShow>
  saveTvShow(tvShow: TvShow)
  saveSeason(tvShow: TvShow, saveRoot: boolean, seasonNumber: number)
  getSeason(id: string, seasonNumber: number) : Promise<TvShow>
  getTvShowRoot(id: string) : Promise<TvShow>
  getAll() : Promise<TvShow[]>
  getAllLazy() : Promise<TvShow[]>
}
