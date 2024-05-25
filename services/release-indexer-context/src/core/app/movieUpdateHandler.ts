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
        const getMovieFromRadarrResponse = (await radarrClient.get(`movie/?tmdbId=${movie._tmdbId}`)).data;
        console.log(JSON.stringify(getMovieFromRadarrResponse));
        const radarrLookupResult = (await radarrClient.get(`movie/lookup/tmdb?tmdbid=${movie._tmdbId}`)).data;
        console.log(JSON.stringify(radarrLookupResult));
        radarrLookupResult.addOptions = { monitor: "none", searchForMovie: false };
        radarrLookupResult.folder = `${movie._originalTitle} (${movie._releaseYear})`;
        radarrLookupResult.rootFolderPath = '/downloads/movies';
        radarrLookupResult.qualityProfileId = 1;
        console.log((await radarrClient.post('movie', radarrLookupResult)).data);
      }
    }
  } catch (e) {
    console.error(e);
  } 
};
