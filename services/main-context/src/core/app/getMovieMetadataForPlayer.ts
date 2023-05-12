import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));

interface GetMovieParam {
  movieId: string;
}

interface GetMovieMetadataResponse {
  subtitles: { [key: string]: string };
  mpdFile: string;
  backdropImage: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number;
}

interface Movie {
  id: string
  subtitles: { [key: string]: string };
  mpdFile: string; 
  backdropImage: string;
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  releaseYear: number; 
}

interface CloudFrontDistro {
  domain: string;
  assumeRoleArnForMainAccount: string;
  signerKeyId: string;
}

export const handler = async (event: GetMovieParam): Promise<GetMovieMetadataResponse> => {
  let movie = await getMovie(event.movieId);
  let cfDistro = await getRandomCloudFrontDistro();
  
  return {
    subtitles: Object.keys(movie.subtitles).reduce((acc, key) => {acc[key] = `https://${cfDistro.domain}/${movie.subtitles[key]}`; return acc;}, {}),
    mpdFile: `https://${cfDistro.domain}/${movie.mpdFile}`,
    backdropImage: movie.backdropImage,
    originalTitle: movie.originalTitle,
    titleL8ns: movie.titleL8ns,
    releaseYear: movie.releaseYear
  };
};

class FailedToGetMovieError extends Error {}

async function getMovie(id: string) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': id }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie: Movie = data.Item as unknown as Movie;
  return movie;
}

async function getRandomCloudFrontDistro() {
  const cfDistros: CloudFrontDistro[] = [];
  const params = {
    TableName: dynamodbCFDistroMetadataTableName,
    ExclusiveStartKey: undefined
  }
  let items;
  do {
    items =  await docClient.scan(params);
    items.Items.forEach((item) => cfDistros.push(item as unknown as CloudFrontDistro));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  const randomIndex = Math.floor(Math.random() * cfDistros.length);
  return cfDistros[randomIndex];
}
