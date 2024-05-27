import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { MovieRepositoryInterface } from "../core/ports/MovieRepositoryInterface";
import { Movie } from "../core/domain/aggregate/Movie";
import { ReleaseCandidate } from "../core/domain/entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../core/domain/entity/TorrentReleaseCandidate";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

export class MovieRepository implements MovieRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  async getMovieById(id: string | undefined): Promise<Movie> {
    const queryParams = {
        TableName: dynamodbMovieTableName,
        Key: { 'id': id }
      } as const;
      let data = await this.docClient.get(queryParams);
      if (data === undefined || data.Item === undefined) {
        throw new FailedToGetMovieError();
      }
      let releaseCandidates: ReleaseCandidate[] = [];
      for (let rcItem of data.Item._releaseCandidates) {
        if (rcItem._tracker != null) {
          const rc = new TorrentReleaseCandidate(true);
          Object.assign(rc, rcItem);
          releaseCandidates.push(rc);
        }
      }
      data.Item._releaseCandidates = releaseCandidates;
      let movie = new Movie(true);
      Object.assign(movie, data.Item);  

    return movie;
  }

  async getAllMovies(): Promise<Movie[]> {
    const movies: Movie[] = [];
    const params = {
      TableName: dynamodbMovieTableName,
      ExclusiveStartKey: undefined
    }
    let items;
    do {
      items =  await this.docClient.scan(params);
      items.Items.forEach((item) => {
        let releaseCandidates: ReleaseCandidate[] = [];
        for (let rcItem of item._releaseCandidates) {
          if (rcItem._tracker != null) {
            const rc = new TorrentReleaseCandidate(true);
            Object.assign(rc, rcItem);
            releaseCandidates.push(rc);
          }
        }
        item._releaseCandidates = releaseCandidates;
        const movie = new Movie(true);
        Object.assign(movie, item);
        movies.push(movie);
      });
      params.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    return movies;
  }

}

class FailedToGetMovieError extends Error {}
