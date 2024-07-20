import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import { S3 } from '@aws-sdk/client-s3';
import { strIsBlank } from '../../utils';
import { TvShowLazy } from '../ports/ITvShowRepository';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const torrentFilesS3Bucket = process.env.TORRENT_FILES_S3_BUCKET!;
const rawMediaFilesS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();
const sonarrApiBaseUrl = process.env.SONARR_API_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const s3 = new S3({});

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const sonarrClient = axios.create({
  baseURL: sonarrApiBaseUrl,
});

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const sonarrApiKey = secret.SONARR_API_KEY!;
    const tmdbApiKey = secret.TMDB_API_KEY!;
    tmdbClient.interceptors.request.use((config) => {
      config.params = config.params || {};
      config.params['api_key'] = tmdbApiKey;
      return config;
    });
    sonarrClient.defaults.headers.common['x-api-key'] = sonarrApiKey;

    for (const record of event.Records) {
      let SK = record.dynamodb?.Keys?.SK.S;
      if (SK !== 'tvshow') {
        continue;
      }  
      if (record.eventName === 'REMOVE') {
        let tvShowId = record.dynamodb?.Keys?.PK.S;
        await emptyS3Directory(rawMediaFilesS3Bucket, tvShowId);
        await emptyS3Directory(torrentFilesS3Bucket, tvShowId);
      } else {
        let tvShow = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as TvShowLazy;
        if (tvShow._tmdbId == null) return;
        const tvShowLookupResponse: any[] = (await sonarrClient.get(`series/lookup/?term=tmdb${tvShow._tmdbId}`)).data;
        // We expect to get exactly one record regardless if the tv show already exists in sonarr or not
        if (tvShowLookupResponse.length !== 1) {
          return;
        }
        const tvdbId = tvShowLookupResponse[0].tvdbId;
        const tvShowGetResponse = (await sonarrClient.get(`series?tvdbId=${tvdbId}`)).data;
        if (tvShowGetResponse.length > 0) return;
        tvShowLookupResponse[0].addOptions = {
          "searchForMissingEpisodes": false,
          "searchForCutoffUnmetEpisodes": false,
          "ignoreEpisodesWithFiles": false,
          "ignoreEpisodesWithoutFiles": false,
          "monitor": "None"
        }
        const rootFolder: string = (await sonarrClient.get(`rootfolder/1`)).data.path;
        tvShowLookupResponse[0].rootFolderPath = rootFolder;
        tvShowLookupResponse[0].path = `${rootFolder}/${tvShow._originalTitle} (${tvShow._releaseYear})`;
        tvShowLookupResponse[0].qualityProfileId = 1; // 1 is the id of quality profile 'Any'
        tvShowLookupResponse[0].seasonFolder = true;
        tvShowLookupResponse[0].seriesType = "standard";
        (await sonarrClient.post('series', tvShowLookupResponse));
      }
    }
  } catch (e) {
    console.error(e);
  } 
};

async function emptyS3Directory(bucket, dir) {
  if (strIsBlank(dir)) return;

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
  
  listedObjects.Contents.forEach(({ Key }) => {
    deleteParams.Delete.Objects.push({ Key } as never);
  });
  
  if (deleteParams.Delete.Objects.length !== 0) {
    await s3.deleteObjects(deleteParams);
  }
  
  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}
