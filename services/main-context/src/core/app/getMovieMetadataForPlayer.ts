import { DynamoDB, SecretsManager } from 'aws-sdk';
import { getSignedCookies } from '@aws-sdk/cloudfront-signer';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;
const dynamodbCFDistroMetadataTableName = process.env.DYNAMODB_CF_DISTRO_METADATA_TABLE_NAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const docClient = new DynamoDB.DocumentClient();
const secretsManager = new SecretsManager();

const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId}).promise();
const secret = JSON.parse(secretStr.SecretString!);

interface GetMovieParam {
  movieId: string;
}

interface GetMovieMetadataResponse {
  subtitles: { [key: string]: string };
  mpdFile: string;
  cloudFrontSignedCookieDomain: string;
  cloudFrontSignedCookieExpires: number;
  cloudFrontSignedCookieSignature: string;
  cloudFrontSignedCookiePath: string;
  cloudFrontSignedCookiePublicKeyId: string;
}

interface Movie {
  id: string
  subtitles: { [key: string]: string };
  mpdFile: string;
}

interface CloudFrontDistro {
  domain: string;
  assumeRoleArnForMainAccount: string;
  signerKeyId: string;
}

export const handler = async (event: GetMovieParam): Promise<GetMovieMetadataResponse> => {
  let movie = await getMovie(event.movieId);
  let cfDistro = await getRandomCloudFrontDistro();
  
  let signedCookies = getSignedCookies({
    url: `https://${cfDistro.domain}/${movie.id}/*`,
    privateKey: Buffer.from(secret.COOKIE_SIGNING_PRIVATE_KEY_BASE64_ENCODED, 'base64'),
    keyPairId: cfDistro.signerKeyId,
    dateLessThan: new Date(Date.now() + (1000 * 60 * 60 * 24 * 1)).toISOString()
  });
  
  return {
    subtitles: movie.subtitles,
    mpdFile: movie.mpdFile,
    cloudFrontSignedCookieDomain: cfDistro.domain,
    cloudFrontSignedCookieExpires: signedCookies['CloudFront-Expires']!,
    cloudFrontSignedCookieSignature: signedCookies['CloudFront-Signature'],
    cloudFrontSignedCookiePath: `/${movie.id}/*`,
    cloudFrontSignedCookiePublicKeyId: cfDistro.signerKeyId
  };
};

class FailedToGetMovieError extends Error {}

async function getMovie(id: string) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': id }
  } as const;
  let data = await docClient.get(queryParams).promise();
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
    items =  await docClient.scan(params).promise();
    items.Items.forEach((item) => cfDistros.push(item as unknown as CloudFrontDistro));
    params.ExclusiveStartKey = items.LastEvaluatedKey;
  } while (typeof items.LastEvaluatedKey !== "undefined");
  const randomIndex = Math.floor(Math.random() * cfDistros.length);
  return cfDistros[randomIndex];
}
