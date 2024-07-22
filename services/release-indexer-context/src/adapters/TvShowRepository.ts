import { ITvShowRepository, TvShowLazy, TvShowWithIdNotFoundError } from "../core/ports/ITvShowRepository";
import { Episode, Season, TvShow } from "../core/domain/aggregate/TvShow";
import { DynamoDBDocument, ScanCommandInput, QueryCommandInput } from "@aws-sdk/lib-dynamodb";

const dynamodbTvShowTableName = process.env.DYNAMODB_TVSHOW_TABLE_NAME!;

export class TvShowRepository implements ITvShowRepository {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }
  
  async getById(id: string | undefined): Promise<TvShow> {
    // episodes also come with the query
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
  
    const tvShowSeasons : { [key:string]: { season?: Season, episodes: Episode[] } } = {};
    do {
      const qco = await this.docClient.query(seasonsQueryInput);
      if (qco.Items) {
       for (const i of qco.Items) {
         if (i.SK.includes('episode')) {
           const end = i.SK.indexOf('episode');
           const k = i.SK.substring(0, end);
           if (tvShowSeasons[k] == null) tvShowSeasons[k] = { episodes: [] };
           tvShowSeasons[k].episodes.push(i as Episode);
         } else {
           if (tvShowSeasons[i.SK] == null) tvShowSeasons[i.SK] = { episodes: [] }; 
           tvShowSeasons[i.SK].season = i as Season;
         }
       }
      }
      if (qco.LastEvaluatedKey) {
        seasonsQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete seasonsQueryInput.ExclusiveStartKey;
      }
    } while (seasonsQueryInput.ExclusiveStartKey);
  
    for (const k in tvShowSeasons) {
      if (tvShowSeasons[k].season != null) {
        tvShowSeasons[k].season!.episodes = tvShowSeasons[k].episodes; 
      } 
    }

    const tvShowDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
      
    if (tvShowDto == null) {
      throw new TvShowWithIdNotFoundError();
    }
    
    tvShowDto.id = tvShowDto.PK;
    tvShowDto.seasons = [];
      
    Object.values(tvShowSeasons).forEach(x => {
      if (x.season != null) tvShowDto.seasons.push(x.season);
    })
    const tvShow: TvShow = TvShow.createEmpty();
    Object.assign(tvShow, tvShowDto);
  
    return tvShow;
  }
  
  async save(t: TvShow, saveRoot: boolean, seasons: number[], episodes: { [key:number] : number[] }) {
    let items: any[] = [];

    if (saveRoot) {
      const tvShowDto: any = {...t};
      delete tvShowDto.id;
      tvShowDto.PK = t.id;
      tvShowDto.SK = 'tvshow';
      delete tvShowDto._seasons;
      items.push(tvShowDto);
    }

    for (const s of (t as any)._seasons) {
      if (seasons.includes(s.seasonNumber)) {
        let seasonDto = {...s};
        seasonDto.PK = t.id;
        seasonDto.SK = `season#${s.seasonNumber}`;
        delete seasonDto.episodes;
        items.push(seasonDto);
      }  
      if (items.length === 100) {
        await transactWrite(this.docClient, items);
        items = [];
      }
    }
    
    for (const s of (t as any)._seasons) {
      if (s.seasonNumber in episodes) {
        for (const e of s.episodes) {
          if (episodes[s.seasonNumber].includes(e.episodeNumber)) {
            let episodeDto = {...e};
            episodeDto.PK = t.id;
            episodeDto.SK = `season#${s.seasonNumber}#${e.episodeNumber}`;
            items.push(episodeDto);
          }
          if (items.length === 100) {
            await transactWrite(this.docClient, items);
            items = [];
          }
        }
      }
    }

    if (items.length !== 0) {
      await transactWrite(this.docClient, items);
    }
  }

  async getAllLazy() {
    const tvShowScanInput : ScanCommandInput = {
      TableName : dynamodbTvShowTableName,
      FilterExpression: "#sk = :sk",
      ExpressionAttributeNames: {
        '#sk': 'SK'
      },
      ExpressionAttributeValues: {
        ':sk': 'tvshow',
      }
    };
    const tvShows: TvShowLazy[] = [] 
    let items;
    do {
      items =  await this.docClient.scan(tvShowScanInput);
      items.Items.forEach((item) => {
        item.id = item.PK;
        tvShows.push(item);
      });
      tvShowScanInput.ExclusiveStartKey = items.LastEvaluatedKey;
    } while (typeof items.LastEvaluatedKey !== "undefined");
    return tvShows;
  }

  async getEpisode(id: string, seasonNumber: number, episodeNumber: number): Promise<TvShow> {
    const tvShowDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
    
    if (tvShowDto == null) throw new TvShowWithIdNotFoundError();
    tvShowDto.id = tvShowDto.PK;

    const tvShowSeasonDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': `season#${seasonNumber}`  }
    })).Item;

    if (tvShowSeasonDto != null) {
      const tvShowEpisodeDto = (await this.docClient.get({
        TableName: dynamodbTvShowTableName,
        Key: { 'PK': id, 'SK': `season#${seasonNumber}episode#${episodeNumber}` }
      })).Item;
      tvShowSeasonDto.episodes = [];
      if (tvShowEpisodeDto != null) {
        tvShowSeasonDto.episodes.push(tvShowEpisodeDto);
      }
    }

    tvShowDto._seasons = [];
    if (tvShowSeasonDto != null) {
      tvShowDto._seasons.push(tvShowSeasonDto);
    }

    const tvShow: TvShow = TvShow.createEmpty();
    Object.assign(tvShow, tvShowDto);

    return tvShow;
  }
}

async function transactWrite(docClient: DynamoDBDocument, items: any[]) {
  await docClient.transactWrite({
    TransactItems : items.map(_ => ({Put: { TableName: dynamodbTvShowTableName, Item: _}}) )
  });
}
