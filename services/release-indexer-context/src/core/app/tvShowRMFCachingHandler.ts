import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { QBittorrentClient } from '../../adapters/QBittorrentClient';
import { execSync } from 'child_process';
import * as fs from 'fs';

interface Params {
  destinationPath: string,
  sourceUrl: string,
  torrentId: string,
  tag: string
}

const qbittorrentApiBaseUrl = process.env.QBITTORRENT_API_BASE_URL!;
const qbittorrentUsername = process.env.QBITTORRENT_USERNAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const destinationS3Bucket = process.env.RAW_MEDIA_FILES_S3_BUCKET!;

const secretsManager = new SecretsManager({});

export const handler = async (event: Params) => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const qbittorrentPassword = secret.QBITTORRENT_PASSWORD!;
  const qbitClient = new QBittorrentClient(qbittorrentApiBaseUrl, qbittorrentUsername, qbittorrentPassword);
  
  const rcloneConfig = `
    [s3]
    type = s3
    provider = AWS
    env_auth = true
  `;
  const rcloneConfigPath = '/tmp/rclone.conf';
  try {
    fs.writeFileSync(rcloneConfigPath, rcloneConfig);
    const command = `rclone copyurl '${event.sourceUrl}' s3:${destinationS3Bucket}/${event.destinationPath} --config ${rcloneConfigPath}`;
    execSync(command);
  } catch (e) {
    console.error(e);  
  }
  await qbitClient.removeTag(event.torrentId, event.tag);
  const torrentInfo = await qbitClient.getTorrentById(event.torrentId);
  if (torrentInfo == null) {
    console.error(`Torrent info is null, event=${JSON.stringify(event)}`);
    return;
  }
  if (torrentInfo.tags.length === 0 || (torrentInfo.tags.length === 1 && torrentInfo.tags[0] === event.tag)) {
    await qbitClient.deleteTorrentById(event.torrentId);
  }
}
