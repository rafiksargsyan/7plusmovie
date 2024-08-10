import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb'
import { S3 } from '@aws-sdk/client-s3'
import { TorrentRelease } from '../domain/entity/TorrentRelease'
import { TvShowRepository } from '../../adapters/TvShowRepository'

const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!
const rawMediaFilesS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions }

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)
const s3 = new S3({});

const ONE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

export const handler = async (event: { tvShowId: string, seasonNumber: number }): Promise<void> => {
  const tvShow = await tvShowRepo.getSeason(event.tvShowId, event.seasonNumber)
  const season = tvShow.seasons[0]
  if (season.readyToBeProcessed) return
  const torrentExclusionList: string[] = []
  const rawAssetsExclusionList: string[] = []
  for (const episode of season.episodes) {
    for (let k in episode.releases) {
      const r = episode.releases[k]
      rawAssetsExclusionList.push(r.release.cachedMediaFileRelativePath)
      if (r.release instanceof TorrentRelease && !r.release.isMagnet()) {
        torrentExclusionList.push(r.release.torrentFileUrl)   
      }
    }
  }
  await emptyS3Directory(torrentFilesS3Bucket, `${tvShow.id}/${season.seasonNumber}`, torrentExclusionList)
  await emptyS3Directory(rawMediaFilesS3Bucket, `${tvShow.id}/${season.seasonNumber}`, rawAssetsExclusionList)
}

async function emptyS3Directory(bucket, dir, exclusionList: string[]) {
  if (dir == null || dir.trim() === "") return;

  const listParams = {
    Bucket: bucket,
    Prefix: dir
  }
  
  const listedObjects = await s3.listObjectsV2(listParams);
  
  if (listedObjects.Contents == undefined ||
    listedObjects.Contents.length === 0) return
  
  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  }
  
  listedObjects.Contents.forEach(({ Key, LastModified }) => {
    if (LastModified != null && (Date.now() - LastModified.getTime() > ONE_DAY_IN_MILLIS) && Key != undefined && !exclusionList.includes(Key)) {
      deleteParams.Delete.Objects.push({ Key } as never)
    }
  })
  
  if (deleteParams.Delete.Objects.length !== 0) {
    await s3.deleteObjects(deleteParams)
  }
  
  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir, exclusionList)
}