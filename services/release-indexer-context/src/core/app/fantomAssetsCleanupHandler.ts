import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { MovieRepository } from '../../adapters/MovieRepository';
import { S3 } from '@aws-sdk/client-s3';
import { TorrentRelease } from '../domain/entity/TorrentRelease';
import { strIsBlank } from '../../utils';

const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!;
const rawMediaFilesS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo = new MovieRepository(docClient);
const s3 = new S3({});

const ONE_DAY_IN_MILLIS = 24 * 60 * 60 * 1000;

export const handler = async (event: { movieId: string }): Promise<void> => {
  const movie = await movieRepo.getMovieById(event.movieId);
  if (movie.readyToBeProcessed) return;
  const torrentExclusionList: string[] = [];
  const rawAssetsExclusionList: string[] = [];
  for (let k in movie.releases) {
    const r = movie.releases[k];
    rawAssetsExclusionList.push(r.release.cachedMediaFileRelativePath);
    if (r.release instanceof TorrentRelease && !r.release.isMagnet()) {
      torrentExclusionList.push(r.release.torrentFileUrl);      
    }
  }
  await emptyS3Directory(torrentFilesS3Bucket, movie.id, torrentExclusionList);
  await emptyS3Directory(rawMediaFilesS3Bucket, movie.id, rawAssetsExclusionList)
};

async function emptyS3Directory(bucket, dir, exclusionList: string[]) {
  if (strIsBlank(dir)) return;
  if (!dir.endswith('/')) dir = `${dir}/`

  const listParams = {
    Bucket: bucket,
    Prefix: dir
  };
  
  const listedObjects = await s3.listObjectsV2(listParams);
  
  if (listedObjects.Contents == undefined ||
    listedObjects.Contents.length === 0) return;
  
  const deleteParams = {
    Bucket: bucket,
    Delete: { Objects: [] }
  };
  
  listedObjects.Contents.forEach(({ Key, LastModified }) => {
    if (LastModified != null && (Date.now() - LastModified.getTime() > ONE_DAY_IN_MILLIS) && Key != undefined && !exclusionList.includes(Key)) {
      deleteParams.Delete.Objects.push({ Key } as never);
    }
  });
  
  if (deleteParams.Delete.Objects.length !== 0) {
    await s3.deleteObjects(deleteParams);
  }
  
  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir, exclusionList);
}
