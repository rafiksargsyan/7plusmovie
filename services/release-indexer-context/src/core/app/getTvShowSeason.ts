import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { TvShowRepository } from '../../adapters/TvShowRepository'
import { TorrentReleaseRead } from '../domain/entity/TorrentRelease'

const docClient = DynamoDBDocument.from(new DynamoDB({}))
const tvShowRepo = new TvShowRepository(docClient)

interface GetSeasonParam {
  tvShowId: string
  seasonNumber: number
}

export const handler = async (event: GetSeasonParam) => {
  let tvShowSeason = await tvShowRepo.getSeason(event.tvShowId, event.seasonNumber)
  let season = tvShowSeason.seasons[0]
  const releases = {};
  if (!season.readyToBeProcessed) {
    for (const e of season.episodes) {
      if (releases[e.episodeNumber] == null) releases[e.episodeNumber] = {}
      for (const k in e.releases) {
        releases[e.episodeNumber][k] = {
          replacedReleaseIds: e.releases[k].replacedReleaseIds,
          release: {
            id: k,
            torrentFileUrl: (e.releases[k].release as unknown as TorrentReleaseRead)._torrentFileUrl,
            mediaFileRelativePath: (e.releases[k].release as unknown as TorrentReleaseRead)._mediaFileRelativePath,
            cachedMediaFileRelativePath: (e.releases[k].release as unknown as TorrentReleaseRead)._cachedMediaFileRelativePath,
            ripType: (e.releases[k].release as unknown as TorrentReleaseRead)._ripType.key,
            resolution: (e.releases[k].release as unknown as TorrentReleaseRead)._resolution.key,
            audios: (e.releases[k].release as unknown as TorrentReleaseRead)._audios.map(a => ({
              stream: a.stream,
              channels: a.channels,
              bitrate: a.bitrate,
              lang: a.lang.key,
            })),
            subs: (e.releases[k].release as unknown as TorrentReleaseRead)._subs.map(s => ({
              stream: s.stream,
              lang: s.lang.key,
              type: s.type?.key,
            }))
          }
        }
      }
    }
  }
  return releases
}
