import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { MovieRepositoryInterface } from "../core/ports/MovieRepositoryInterface";
import { Movie } from "../core/domain/aggregate/Movie";
import { ReleaseCandidate } from "../core/domain/entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../core/domain/entity/TorrentReleaseCandidate";
import { TorrentRelease } from "../core/domain/entity/TorrentRelease";

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

export class MovieRepository implements MovieRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  async saveMovie(m: Movie) {
    await this.docClient.put({TableName: dynamodbMovieTableName, Item: m});
  }

  async getMovieById(id: string | undefined): Promise<Movie> {
    const queryParams = {
        TableName: dynamodbMovieTableName,
        Key: { '_id': id }
      } as const;
      let data = await this.docClient.get(queryParams);
      if (data === undefined || data.Item === undefined) {
        throw new FailedToGetMovieError();
      }
      let releaseCandidates: { [key:string] : ReleaseCandidate } = {};
      for (let rcItemKey in data.Item._releaseCandidates) {
        const rcItem = data.Item._releaseCandidates[rcItemKey];
        if (rcItem._tracker != null) {
          const rc = new TorrentReleaseCandidate(true);
          Object.assign(rc, rcItem);
          releaseCandidates[rcItemKey] = rc;
        }
      }
      data.Item._releaseCandidates = releaseCandidates;
      let releases = {};
      for (let rItemKey in data.Item._releases) {
        const rItem = data.Item._releases[rItemKey];
        if (rItem.release._tracker != null) {
          const release = new TorrentRelease(true);
          Object.assign(release, rItem.release);
          releases[rItemKey] = { ...rItem, release: release };
        }
      }
      data.Item._releases = releases;
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
        let releaseCandidates: { [key:string] : ReleaseCandidate } = {};
        for (let rcItemKey in item._releaseCandidates) {
          const rcItem = item._releaseCandidates[rcItemKey];
          if (rcItem._tracker != null) {
            const rc = new TorrentReleaseCandidate(true);
            Object.assign(rc, rcItem);
            releaseCandidates[rcItemKey] = rc;
          }
        }
        item._releaseCandidates = releaseCandidates;
        let releases = {};
        for (let rItemKey in item._releases) {
          const rItem = item._releases[rItemKey];
          if (rItem.release._tracker != null) {
            const release = new TorrentRelease(true);
            Object.assign(release, rItem.release);
            releases[rItemKey] = { ...rItem, release: release };
          }
        }
        item._releases = releases;
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
