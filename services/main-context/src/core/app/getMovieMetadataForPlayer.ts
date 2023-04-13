import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));
const secretsManager = new SecretsManager({});

interface GetMovieParam {
  movieId: string;
}

interface GetMovieMetadataResponse {
  subtitles: { [key: string]: string };
  mpdFile: string;
  cloudFrontSignedUrlParams: string;
  backdropImage: string;
}

interface Movie {
  id: string
  subtitles: { [key: string]: string };
  mpdFile: string; 
  backdropImage: string; 
}

interface CloudFrontDistro {
  domain: string;
  assumeRoleArnForMainAccount: string;
  signerKeyId: string;
}

export const handler = async (event: GetMovieParam): Promise<GetMovieMetadataResponse> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  let movie = await getMovie(event.movieId);
  let cfDistro = await getRandomCloudFrontDistro();
  
  const url = `https://${cfDistro.domain}/${movie.id}/*`; 
  const policy = JSON.stringify({
    "Statement": [{
       "Resource": url,
       "Condition": {
          "DateLessThan": {
            "AWS:EpochTime": Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 1)
          }
       }
    }]
  });
  const privateKey = Buffer.from(secret.COOKIE_SIGNING_PRIVATE_KEY_BASE64_ENCODED, 'base64').toString();
  const keyPairId = cfDistro.signerKeyId;
  const signedUrl = getSignedUrl({url, privateKey, keyPairId, policy});
  
  return {
    subtitles: movie.subtitles,
    mpdFile: `https://${cfDistro.domain}/${movie.mpdFile}`,
    cloudFrontSignedUrlParams: signedUrl.substring(signedUrl.indexOf("?") + 1),
    backdropImage: movie.backdropImage
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
