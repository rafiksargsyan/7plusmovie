import { ITvShowRepository, TvShowLazy, TvShowSeasonsLazy, TvShowWithIdNotFoundError } from "../core/ports/ITvShowRepository";
import { Episode, Season, TvShow } from "../core/domain/aggregate/TvShow";
import { DynamoDBDocument, ScanCommandInput, QueryCommandInput, DeleteCommandInput } from "@aws-sdk/lib-dynamodb";
import { ReleaseCandidate } from "../core/domain/entity/ReleaseCandidate";
import { TorrentReleaseCandidate } from "../core/domain/entity/TorrentReleaseCandidate";
import { TorrentRelease } from "../core/domain/entity/TorrentRelease";

const dynamodbTvShowTableName = process.env.DYNAMODB_TVSHOW_TABLE_NAME!;

export class TvShowRepository implements ITvShowRepository {
  private docClient: DynamoDBDocument;
    
  public constructor(docClient: DynamoDBDocument) {
    this.docClient = docClient;
  }
  
  async getById(id: string | undefined): Promise<TvShow> {
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
  
    const seasons : { [key:number]: Season } = {};
    do {
      const qco = await this.docClient.query(seasonsQueryInput);
      if (qco.Items) {
       for (const i of qco.Items) {
        const s = i as Season;
        seasons[s.seasonNumber] = s;
       }
      }
      if (qco.LastEvaluatedKey) {
        seasonsQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete seasonsQueryInput.ExclusiveStartKey;
      }
    } while (seasonsQueryInput.ExclusiveStartKey);
  
    const episodesQueryInput : QueryCommandInput = {
      TableName : dynamodbTvShowTableName,
      KeyConditionExpression: '#id = :id AND begins_with(#sortKey, :sortKeySeason)',
      ExpressionAttributeNames: {
        '#id': 'PK',
        '#sortKey': 'SK',
      },
      ExpressionAttributeValues: {
        ':id': id,
        ':sortKeySeason': 'episode',
      }
    };
    
    do {
      const qco = await this.docClient.query(episodesQueryInput);
      if (qco.Items) {
        for (const i of qco.Items) {
          const e = i as Episode;
    
          let releaseCandidates: { [key:string] : ReleaseCandidate } = {};
          for (let rcItemKey in e.releaseCandidates) {
            const rcItem = e.releaseCandidates[rcItemKey];
            if ((rcItem as any).tracker != null) {
              const rc = new TorrentReleaseCandidate(true);
              Object.assign(rc, rcItem);
              releaseCandidates[rcItemKey] = rc;
            }
          }
          e.releaseCandidates = releaseCandidates;
          let releases = {};
          for (let rItemKey in e.releases) {
            const rItem = e.releases[rItemKey];
            if ((rItem.release as any).tracker != null) {
              const release = new TorrentRelease(true);
              Object.assign(release, rItem.release);
              releases[rItemKey] = { ...rItem, release: release };
            }
          }
          e.releases = releases;      

          const seasonNumberStart = i.SK.indexOf('#') + 1;
          const seasonNumberEnd = i.SK.lastIndexOf('#');
          const seasonNumber = Number.parseInt(i.SK.substring(seasonNumberStart, seasonNumberEnd));
          if (seasons[seasonNumber].episodes == null) {
            seasons[seasonNumber].episodes = [];
          }
          seasons[seasonNumber].episodes.push(e);
        }
      }
      if (qco.LastEvaluatedKey) {
        episodesQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete episodesQueryInput.ExclusiveStartKey;
      }
    } while (episodesQueryInput.ExclusiveStartKey);

    const tvShowDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
      
    if (tvShowDto == null) {
      throw new TvShowWithIdNotFoundError();
    }
    
    tvShowDto.id = tvShowDto.PK;
    tvShowDto._seasons = Object.values(seasons);

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
            episodeDto.SK = `episode#${s.seasonNumber}#${e.episodeNumber}`;
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
        Key: { 'PK': id, 'SK': `episode#${seasonNumber}#${episodeNumber}` }
      })).Item as Episode;

      let releaseCandidates: { [key:string] : ReleaseCandidate } = {};
      for (let rcItemKey in tvShowEpisodeDto.releaseCandidates) {
        const rcItem = tvShowEpisodeDto.releaseCandidates[rcItemKey];
        if ((rcItem as any).tracker != null) {
          const rc = new TorrentReleaseCandidate(true);
          Object.assign(rc, rcItem);
          releaseCandidates[rcItemKey] = rc;
        }
      }
      tvShowEpisodeDto.releaseCandidates = releaseCandidates;
      let releases = {};
      for (let rItemKey in tvShowEpisodeDto.releases) {
        const rItem = tvShowEpisodeDto.releases[rItemKey];
        if ((rItem.release as any).tracker != null) {
          const release = new TorrentRelease(true);
          Object.assign(release, rItem.release);
          releases[rItemKey] = { ...rItem, release: release };
        }
      }
      tvShowEpisodeDto.releases = releases;

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

  async deleteById(id: string) {
    const queryInput : QueryCommandInput = {
      TableName : dynamodbTvShowTableName,
      KeyConditionExpression: '#id = :id',
      ExpressionAttributeNames: {
        '#id': 'PK',
      },
      ExpressionAttributeValues: {
        ':id': id,
      }
    };

    const items: any[] = [];

    do {
      const qco = await this.docClient.query(queryInput);
      if (qco.Items) {
        items.push(...qco.Items);
      }
      if (qco.LastEvaluatedKey) {
        queryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete queryInput.ExclusiveStartKey;
      }
    } while (queryInput.ExclusiveStartKey);

    const BATCH_SIZE = 25;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE);
      await batchDelete(this.docClient, batch);
    }
  }

  async getTvShowLazy(id: string) {
    const seasonsQueryInput : QueryCommandInput = {
      TableName : dynamodbTvShowTableName,
      KeyConditionExpression: '#id = :id AND begins_with(#sortKey, :sortKeySeason)',
      ExpressionAttributeNames: {
        '#id': 'PK',
        '#sortKey': 'SK'
      },
      ExpressionAttributeValues: {
        ':id': id,
        ':sortKeySeason': 'season'
      }
    };
    
    const seasons : Omit<Season, 'episodes'>[] = [];
    do {
      const qco = await this.docClient.query(seasonsQueryInput);
      seasons.push(...qco.Items as Omit<Season, 'episodes'>[]);
      if (qco.LastEvaluatedKey) {
        seasonsQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
      } else {
        delete seasonsQueryInput.ExclusiveStartKey;
      }
    } while (seasonsQueryInput.ExclusiveStartKey);

    const tvShowDto = (await this.docClient.get({
      TableName: dynamodbTvShowTableName,
      Key: { 'PK': id, 'SK': 'tvshow'  }
    })).Item;
      
    if (tvShowDto == null) {
      throw new TvShowWithIdNotFoundError();
    }
    
    tvShowDto.id = tvShowDto.PK;
    tvShowDto.seasons = seasons;

    return tvShowDto as TvShowSeasonsLazy;
  }

  async getSeason(id: string, seasonNumber: number): Promise<TvShow> {
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
      tvShowSeasonDto.episodes = [];
      const episodesQueryInput : QueryCommandInput = {
        TableName : dynamodbTvShowTableName,
        KeyConditionExpression: '#id = :id AND begins_with(#sortKey, :sortKeySeason)',
        ExpressionAttributeNames: {
          '#id': 'PK',
          '#sortKey': 'SK',
        },
        ExpressionAttributeValues: {
          ':id': id,
          ':sortKeySeason': `episode#${seasonNumber}#`,
        }
      };
      
      do {
        const qco = await this.docClient.query(episodesQueryInput);
        if (qco.Items) {
          for (const i of qco.Items) {
            const e = i as Episode;
            let releaseCandidates: { [key:string] : ReleaseCandidate } = {};
            for (let rcItemKey in e.releaseCandidates) {
              const rcItem = e.releaseCandidates[rcItemKey];
              if ((rcItem as any).tracker != null) {
                const rc = new TorrentReleaseCandidate(true);
                Object.assign(rc, rcItem);
                releaseCandidates[rcItemKey] = rc;
              }
            }
            e.releaseCandidates = releaseCandidates;
            let releases = {};
            for (let rItemKey in e.releases) {
              const rItem = e.releases[rItemKey];
              if ((rItem.release as any).tracker != null) {
                const release = new TorrentRelease(true);
                Object.assign(release, rItem.release);
                releases[rItemKey] = { ...rItem, release: release };
              }
            }
            e.releases = releases;
            tvShowSeasonDto.episodes.push(e);
          }
        }
        if (qco.LastEvaluatedKey) {
          episodesQueryInput.ExclusiveStartKey = qco.LastEvaluatedKey;
        } else {
          delete episodesQueryInput.ExclusiveStartKey;
        }
      } while (episodesQueryInput.ExclusiveStartKey);
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

async function batchDelete(docClient: DynamoDBDocument, items: any[]) {
  await docClient.batchWrite({
    RequestItems: {
      [dynamodbTvShowTableName]: items.map(i => ({
        DeleteRequest: {
           Key: {
             PK: i.PK,
             SK: i.SK
           }
        }
      }))
    }
  }) 
}
