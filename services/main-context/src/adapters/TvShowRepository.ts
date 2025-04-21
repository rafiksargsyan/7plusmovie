import { TvShow } from "../core/domain/aggregate/TvShow"
import { TvShowRepositoryInterface } from "../core/ports/TvShowRepositoryInterface"
import { DynamoDBDocument, QueryCommandInput, ScanCommandInput } from "@aws-sdk/lib-dynamodb"
import { Nullable } from "../utils";

const dynamodbTvShowTableName = process.env.DYNAMODB_TV_SHOW_TABLE_NAME!;

export class TvShowRepository implements TvShowRepositoryInterface {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }

  async getByIdLazy(id: Nullable<string>): Promise<TvShow> {
    const tvShowDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
    
    if (tvShowDto == null) {
      throw new FailedToGetTvShowError();
    }
  
    tvShowDto.id = tvShowDto.PK;
    
    const tvShow: TvShow = new TvShow(true);
    Object.assign(tvShow, tvShowDto);

    return tvShow;
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
        tvShowSeasons.push(...qco.Items);
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
  
  async saveSeason(tvShow: TvShow, saveRoot: boolean, seasonNumber: number) {
    const itemsToSave: any[] = []
    const tvShowDao: any = {...tvShow}
    delete tvShowDao.id
    tvShowDao.PK = tvShow.id
    tvShowDao.SK = 'tvshow'
    delete tvShowDao.seasons
    if (saveRoot) {
      itemsToSave.push({ Put: { TableName: dynamodbTvShowTableName, Item: tvShowDao}})
    }
    let season = tvShow.getSeasonOrThrow(seasonNumber)
    let seasonDao: any = {...season}
    seasonDao.PK = tvShow.id
    seasonDao.SK = `season#${season.seasonNumber}`
    itemsToSave.push({ Put: { TableName: dynamodbTvShowTableName, Item: seasonDao}})
    await this.docClient.transactWrite({
      TransactItems : itemsToSave
    })
  }

  async getSeason(id: string, seasonNumber: number): Promise<TvShow> {
    const seasonDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': `season#${seasonNumber}`  }
    })).Item

    const tvShowDao = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
    
    if (tvShowDao == null) {
      throw new FailedToGetTvShowError();
    }
  
    tvShowDao.id = tvShowDao.PK
    tvShowDao.seasons = [seasonDto]
    
    const tvShow: TvShow = new TvShow(true);
    Object.assign(tvShow, tvShowDao);

    return tvShow;
  }

  async getTvShowRoot(id: string): Promise<TvShow> {
    const tvShowDao = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
    if (tvShowDao == null) {
      throw new FailedToGetTvShowError();
    }
    tvShowDao.id = tvShowDao.PK
    const tvShow: TvShow = new TvShow(true)
    Object.assign(tvShow, tvShowDao)
    return tvShow
  }

  async getAll(): Promise<TvShow[]> {
    const tvShowScanInput : ScanCommandInput = {
      TableName : dynamodbTvShowTableName,
      FilterExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        '#sk': 'SK'
      },
      ExpressionAttributeValues: {
        ':sk': 'tvshow',
      }
    }
    const tvShowItems: any[] = []
    let items
    do {
      items =  await this.docClient.scan(tvShowScanInput)
      items.Items.forEach((item) => {
        tvShowItems.push(item)
      })
      tvShowScanInput.ExclusiveStartKey = items.LastEvaluatedKey
    } while (typeof items.LastEvaluatedKey !== "undefined")
    const ret: TvShow[]  = []
    for (const tvShowItem of tvShowItems) {
      ret.push(await this.getTvShowById(tvShowItem.PK))
    }
    return ret
  }

  async getAllLazy(): Promise<TvShow[]> {
    const tvShowScanInput : ScanCommandInput = {
      TableName : dynamodbTvShowTableName,
      FilterExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        '#sk': 'SK'
      },
      ExpressionAttributeValues: {
        ':sk': 'tvshow',
      }
    }
    const tvShowItems: any[] = []
    let items
    do {
      items =  await this.docClient.scan(tvShowScanInput)
      items.Items.forEach((item) => {
        tvShowItems.push(item)
      })
      tvShowScanInput.ExclusiveStartKey = items.LastEvaluatedKey
    } while (typeof items.LastEvaluatedKey !== "undefined")

    return tvShowItems.map(i => {
      i.id = i.PK
      const tvShow: TvShow = new TvShow(true);
      Object.assign(tvShow, i);
      return tvShow;
    });
  }

  async findTvShowByTvdbId(id: number): Promise<Nullable<string>> {
    const queryParams = {
      TableName: dynamodbTvShowTableName,
      IndexName: 'tvdb-id',
      KeyConditionExpression: "#tvdbId = :tvdbId",
      ExpressionAttributeNames:{
        "#tvdbId": "_tvdbId"
      },
      ExpressionAttributeValues: {
        ":tvdbId": id
      }
    };
    let data = await this.docClient.query(queryParams);
    return data.Items?.[0]?.PK;
  }

  async findTvShowByTmdbId(id: number): Promise<Nullable<string>> {
    const queryParams = {
      TableName: dynamodbTvShowTableName,
      IndexName: 'tmdb-id',
      KeyConditionExpression: "#tmdbId = :tmdbId",
      ExpressionAttributeNames:{
        "#tmdbId": "tmdbId"
      },
      ExpressionAttributeValues: {
        ":tmdbId": `${id}`
      }
    };
    let data = await this.docClient.query(queryParams);
    return data.Items?.[0]?.PK;
  }

  async findTvShowByImdbId(id: string): Promise<Nullable<string>> {
    const queryParams = {
      TableName: dynamodbTvShowTableName,
      IndexName: 'imdb-id',
      KeyConditionExpression: "#imdbId = :imdbId",
      ExpressionAttributeNames:{
        "#imdbId": "_imdbId"
      },
      ExpressionAttributeValues: {
        ":imdbId": id
      }
    };
    let data = await this.docClient.query(queryParams);
    return data.Items?.[0]?.PK;
  }
}

class FailedToGetTvShowError extends Error {}
