import { DynamoDBDocument} from "@aws-sdk/lib-dynamodb";
import { Movie } from "../core/domain/aggregate/Movie";
import { IMovieRepository } from "../core/ports/IMovieRepository";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { Nullable } from "../utils";

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

  async findMovieByTmdbId(id: number): Promise<Nullable<string>> {
    const queryParams = {
      TableName: this._movieTableName,
      IndexName: 'tmdb-id',
      KeyConditionExpression: "#tmdbId = :tmdbId",
      ExpressionAttributeNames:{
        "#tmdbId": "tmdbId"
      },
      ExpressionAttributeValues: {
        ":tmdbId": `${id}`
      }
    };
    let data = await this._docClient.query(queryParams);
    return data.Items[0]?.id;
  }

  async findMovieByImdbId(id: string): Promise<Nullable<string>> {
    const queryParams = {
    TableName: this._movieTableName,
    IndexName: 'imdb-id',
      KeyConditionExpression: "#imdbId = :imdbId",
      ExpressionAttributeNames:{
        "#imdbId": "_imdbId"
      },
      ExpressionAttributeValues: {
        ":imdbId": id
      }
    };
    let data = await this._docClient.query(queryParams);
    return data.Items[0]?.id;
  }

  async saveMovie(m: Movie) {
    await this._docClient.put({ TableName: this._movieTableName, Item: m });
  }
}
