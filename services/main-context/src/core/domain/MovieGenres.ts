export const MovieGenres = {
  ACTION : { EN_US : "Action", RU : "Боевик" },
  ADVENTURE : { EN_US : "Adventure", RU : "Приключения" },
  ANIMATION : { EN_US : "Animation", RU : "Анимация" },
  BIOGRAPHY : { EN_US : "Biography", RU : "Биография" },
  COMEDY : { EN_US : "Comedy", RU : "Комедия" },
  CRIME : { EN_US : "Crime", RU : "Криминал" },
  DOCUMENTARY : { EN_US : "Documentary", RU : "Документальный" },
  DRAMA : { EN_US : "Drama", RU : "Драма" },
  FAMILY : { EN_US : "Family", RU : "Семейный" },
  FANTASY : { EN_US : "Fantasy", RU : "Фантастика" },
  FILM_NOIR : { EN_US : "Film Noir", RU : "Фильм-нуар" },
  HISTORY : { EN_US : "History", RU : "Исторический" },
  HORROR : { EN_US : "Horror", RU : "Ужасы" },
  MUSIC : { EN_US : "Music", RU : "Музыка" },
  MUSICAL : { EN_US : "Musical", RU : "Мюзикл" },
  MYSTERY : { EN_US : "Mystery", RU : "Мистический " },
  ROMANCE : { EN_US : "Romance", RU : "Романтика" },
  SCI_FI : { EN_US : "Sci-Fi", RU : "Научная фантастика" },
  SHORT : { EN_US : "Short", RU : "Короткометражный" },
  SPORT : { EN_US : "Sport", RU : "Спорт" },
  THRILLER : { EN_US : "Thriller", RU : "Триллер" },
  WAR : { EN_US : "War", RU : "Военный" },
  WESTERN : { EN_US : "Western", RU : "Вестерн" },
} as const;
  
export class MovieGenre {
  readonly code: string;
  
  public constructor(code: string) {
    if (!(code in MovieGenres)) {
      throw new InvalidMovieGenreError();
    }
    this.code = code;
  }
}

class InvalidMovieGenreError extends Error {}
