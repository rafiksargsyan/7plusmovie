import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { Movie } from "../domain/aggregate/Movie";
import axios from 'axios';
import { L8nLang} from '../domain/value-object/L8nLang';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const radarrBaseUrl = process.env.RADARR_BASE_URL!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const radarrClient = axios.create({
  baseURL: radarrBaseUrl,
});

interface MovieRead {
  _id: string;
  _tmdbId: string;
  _originalTitle: string;
  _releaseYear: number;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const radarrApiKey = secret.RADARR_API_KEY!;
    radarrClient.defaults.headers.common['x-api-key'] = radarrApiKey;

    for (const record of event.Records) {
      if (record.eventName === 'REMOVE') {
        // todo
      } else {
        let movie: MovieRead = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as MovieRead;
        if (movie._tmdbId == null) return;
        const getMovieFromRadarrResponse: any[] = (await radarrClient.get(`movie/?tmdbId=${movie._tmdbId}`)).data;
        // check if the movie already exists in radarr
        if (getMovieFromRadarrResponse.length > 0) {
          return;
        }
        const radarrLookupResponse = (await radarrClient.get(`movie/lookup/tmdb?tmdbid=${movie._tmdbId}`)).data;
        radarrLookupResponse.addOptions = { monitor: "none", searchForMovie: false };
        radarrLookupResponse.folder = `${movie._originalTitle} (${movie._releaseYear})`;
        const rootFolder: string = (await radarrClient.get(`rootfolder/1`)).data.path;
        radarrLookupResponse.rootFolderPath = rootFolder;
        radarrLookupResponse.qualityProfileId = 1; // 1 is the id of quality profile 'Any'
        (await radarrClient.post('movie', radarrLookupResponse));
      }
    }
  } catch (e) {
    console.error(e);
  } 
};
