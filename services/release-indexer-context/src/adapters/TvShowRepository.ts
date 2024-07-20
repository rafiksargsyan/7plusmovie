import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { ITvShowRepository } from "../core/ports/ITvShowRepository";
import { TvShow } from "../core/domain/aggregate/TvShow";

const dynamodbTvShowTableName = process.env.DYNAMODB_TVSHOW_TABLE_NAME!;

export class TvShowRepository implements ITvShowRepository {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }
  
  getById(id: string | undefined): Promise<TvShow> {
    throw new Error("Method not implemented.");
  }
  
  save(t: TvShow) {
    throw new Error("Method not implemented.");
  }
}