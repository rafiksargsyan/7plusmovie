import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import axios from 'axios';

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);
const secretsManager = new SecretsManager({});

const qbittorrentApiBaseUrl = process.env.QBITTORRENT_API_BASE_URL!;
const qbittorrentBaseUrl = process.env.QBITTORRENT_BASE_URL!;
const qbittorrentUsername = process.env.QBITTORRENT_USERNAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const qbittorrentClient = axios.create({
  baseURL: qbittorrentApiBaseUrl,
});

export const handler = async (): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const qbittorrentPassword = secret.QBITTORRENT_PASSWORD!;
  const loginResponse = (await qbittorrentClient.post('auth/login', `username=${qbittorrentUsername}&password=${qbittorrentPassword}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': `${qbittorrentBaseUrl}` }
  })).headers;
  console.log(JSON.stringify(loginResponse));
  const setCookie = loginResponse['set-cookie'];
  let sessionCookie;
  if (setCookie != null) sessionCookie = setCookie[0];
  sessionCookie = sessionCookie.substring(0, sessionCookie.indexOf(';'));
  const logoutResponse = (await qbittorrentClient.post('auth/logout', null, {
    headers: { 'Cookie': `${sessionCookie}`, 'Referer': `${qbittorrentBaseUrl}` }
  })).status;
  console.log(JSON.stringify(logoutResponse));
};
