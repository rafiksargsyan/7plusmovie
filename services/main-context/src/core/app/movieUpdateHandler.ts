import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});

const marshaller = new Marshaller();

interface Movie {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  subtitles: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string }
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, secret.ALGOLIA_ADMIN_KEY!);
  const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);
  
  for (const record of event.Records) {
    let movie: Movie = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as Movie;
    await algoliaIndex.saveObject({ objectID: movie.id,
                                    category: "MOVIE",
                                    originalTitle: movie.originalTitle,
                                    posterImagesPortrait: movie.posterImagesPortrait,
                                    titleL8ns: movie.titleL8ns,
                                    releaseYear: movie.releaseYear });
  }
};
