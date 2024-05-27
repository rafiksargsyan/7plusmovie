import { Movie } from "../domain/aggregate/Movie";

export interface MovieRepositoryInterface {
  getMovieById(id: string | undefined) : Promise<Movie>;
  getAllMovies() : Promise<Movie[]>;
}
