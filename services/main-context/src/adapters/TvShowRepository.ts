import { TvShow } from "../core/domain/TvShow";
import { TvShowRepositoryInterface } from "../core/ports/TvShowRepositoryInterface";
import { DynamoDBDocument, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

export class TvShowRepository implements TvShowRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  async getTvShowById(id: string | undefined): Promise<TvShow> {
    const seasonsQueryInput : QueryCommandInput = {
      TableName : dynamodbTvShowTableName,
      KeyConditionExpression: '#id = :id AND begins_with(#sortKey, :sortKeySeason)',
      ExpressionAttributeNames: {
        '#id': 'PK',
        '#sortKey': 'SK',
      },
      ExpressionAttributeValues: {
        ':id': id,
        ':sortKeySeason': 'season',
      }
    };

    const tvShowSeasons : Record<string, any> = [];
    do {
      const qco = await this.docClient.query(seasonsQueryInput);
      if (qco.Items) {
        tvShowSeasons.push(qco.Items);
      }
      if (qco.LastEvaluatedKey) {
        seasonsQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete seasonsQueryInput.ExclusiveStartKey;
      }
    } while (seasonsQueryInput.ExclusiveStartKey);

    const tvShowDao = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
    
    if (tvShowDao == null) {
      throw new FailedToGetTvShowError();
    }
  
    tvShowDao.id = tvShowDao.PK;
    tvShowDao.seasons = tvShowSeasons;
    
    const tvShow: TvShow = new TvShow(true);
    Object.assign(tvShow, tvShowDao);

    return tvShow;
  }

  async saveTvShow(tvShow: TvShow) {
    const tvShowDao: any = {...tvShow};
    delete tvShowDao.id;
    tvShowDao.PK = tvShow.id;
    tvShowDao.SK = 'tvshow';
    let seasonsDao: any[] = [];
    tvShowDao.seasons.forEach(_ => {
      let seasonDao: any = {..._};
      seasonDao.PK = tvShow.id;
      seasonDao.SK = `season#${_.seasonNumber}`;
      seasonsDao.push(seasonDao);
    })
    delete tvShowDao.seasons;
    await this.docClient.transactWrite({
      TransactItems : [ { Put: { TableName: dynamodbTvShowTableName, Item: tvShowDao}} ]
      .concat(seasonsDao.map(_ => { return {Put: { TableName: dynamodbTvShowTableName, Item: _}} }))
    })
  }

}

class FailedToGetTvShowError extends Error {}
