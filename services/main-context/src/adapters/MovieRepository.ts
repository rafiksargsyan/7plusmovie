import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Movie } from "../core/domain/aggregate/Movie";
import { IMovieRepository } from "../core/ports/IMovieRepository";
import { DynamoDB } from "@aws-sdk/client-dynamodb";

export class MovieRepository implements IMovieRepository {
  private _docClient;
  private _movieTableName;

  constructor(movieTableName: string) {
    this._movieTableName = movieTableName;
    this._docClient = DynamoDBDocument.from(new DynamoDB({}), {
      marshallOptions:  {
        convertClassInstanceToMap: true
      }
    });
  }

  async getMovieById(id: string): Promise<Movie> {
    const queryParams = {
      TableName: this._movieTableName,
      Key: { 'id': id }
    } as const;
    const data = await this._docClient.get(queryParams);
    const movie = new Movie(true);
    Object.assign(movie, data.Item);
    return movie;
  }

  findMoviByTmdbId(id: number): Promise<string> {
    throw new Error("Method not implemented.");
  }

  findMovieByImdbId(id: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async saveMovie(m: Movie) {
    await this._docClient.put({ TableName: this._movieTableName, Item: m });
  }
}
