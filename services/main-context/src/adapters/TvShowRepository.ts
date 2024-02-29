import { TvShow } from "../core/domain/TvShow";
import { TvShowRepositoryInterface } from "../core/ports/TvShowRepositoryInterface";
import { DynamoDBDocument, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

class TvShowRepository implements TvShowRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  getTvShowById(id: string): TvShow {
    const qci : QueryCommandInput = {
      TableName : dynamodbTvShowTableName,
      Key
    }
    const tvShowAndSeasons: Record<string, any>[] = [];
    do {
      const qco = await this.docClient.query(qci);
      if (qco.Items) {
        tvShowAndSeasons.push(qco.Items);
      }
      if (qco.LastEvaluatedKey) {
        qci.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete qci.ExclusiveStartKey;
      }
    } while (qci.ExclusiveStartKey);
    let tvShow;
    let seasons = [];
    tvShowAndSeasons.forEach(_ => {
      if (_.)
    })
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
