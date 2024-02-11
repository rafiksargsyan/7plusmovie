import { TvShow } from "../core/domain/TvShow";
import { TvShowRepositoryInterface } from "../core/ports/TvShowRepositoryInterface";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;
const dynamodbTvShowSeasonTableName = process.env.DYNAMODB_TV_SHOW_SEASON_TABLE_NAME!;

interface TvShowRead {
  seasonIds: string[];
}

class TvShowRepository implements TvShowRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  getTvShowById(id: string): TvShow {
    throw new Error("Method not implemented.");
  }

  saveTvShow(tvShow: TvShow) {
    throw new Error("Method not implemented.");
  }

  private async getTvShow(id: string): Promise<TvShowRead> {
    const queryParams = {
      TableName: dynamodbTvShowTableName,
      Key: { 'id': id }
    } as const;
    let data = await this.docClient.get(queryParams);
    if (data == undefined || data.Item == undefined) {
      throw new FailedToGetTvShowError();
    }
    let tvShow: TvShow = data.Item as unknown as TvShow;
    return tvShow;
  }
}

const class FailedToGetTvShowError extends Error {}
