import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { Movie } from '../domain/aggregate/Movie';
import axios from 'axios';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const movitTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const radarrBaseUrl = process.env.RADARR_BASE_URL!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const radarrClient = axios.create({
  baseURL: radarrBaseUrl,
});

export const handler = async (): Promise<void> => {
  const movies = await getAllMovies();
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const radarrApiKey = secret.RADARR_API_KEY!;
  radarrClient.defaults.headers.common['x-api-key'] = radarrApiKey;
  for (const m of movies) {
    const radarrMovieId = (await radarrClient.get(`movie/?tmdbId=${m.tmdbId}`)).data[0].id;
    console.log((await radarrClient.get(`release/?movieId=${radarrMovieId}`)).data);
  }
};

async function getAllMovies(): Promise<Movie[]> {
  const movies: Movie[] = [];
  const params = {
    TableName: movitTableName,
    ExclusiveStartKey: undefined
  }
  let items;
  do {
    items =  await docClient.scan(params);
    items.Items.forEach((item) => {
      const cfDistro = new Movie(true);
      Object.assign(cfDistro, item);
      movies.push(cfDistro);
    });
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  return movies;
}
