import { Nullable } from "../../utils";
import { Movie } from "../domain/aggregate/Movie"

export interface IMovieRepository {
  getMovieById(id: string) : Promise<Movie>;
  findMovieByTmdbId(id: number) : Promise<Nullable<string>>;
  findMovieByImdbId(id: string) : Promise<Nullable<string>>;
  saveMovie(m: Movie);
}
