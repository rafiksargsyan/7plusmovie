import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import axios from 'axios';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';

const movitTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const radarrBaseUrl = process.env.RADARR_BASE_URL!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);

const radarrClient = axios.create({
  baseURL: radarrBaseUrl,
});

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const radarrApiKey = secret.RADARR_API_KEY!;
  radarrClient.defaults.headers.common['x-api-key'] = radarrApiKey;
  for (const m of movies) {
    const radarrMovieId = (await radarrClient.get(`movie/?tmdbId=${m.tmdbId}`)).data[0].id;
    const getReleasesResult = (await radarrClient.get(`release/?movieId=${radarrMovieId}`)).data;

  }
};
