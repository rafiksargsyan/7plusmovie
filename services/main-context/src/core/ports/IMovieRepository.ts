import { Movie } from "../domain/aggregate/Movie"

export interface IMovieRepository {
  getMovieById(id: string) : Promise<Movie>;
  findMoviByTmdbId(id: number) : Promise<string>;
  findMovieByImdbId(id: string) : Promise<string>;
  saveMovie(m: Movie);
}
