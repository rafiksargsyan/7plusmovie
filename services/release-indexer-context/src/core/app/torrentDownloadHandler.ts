import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { QBittorrentClient } from '../../adapters/QBittorrentClient';
import { execSync } from 'child_process';
import { ReleaseCandidate, ReleaseCandidateStatus } from '../domain/entity/ReleaseCandidate';
import { TorrentReleaseCandidate } from '../domain/entity/TorrentReleaseCandidate';
import { Nullable } from '../../Nullable';
import { TorrentInfo } from '../ports/TorrentClientInterface';
import { Movie } from '../domain/aggregate/Movie';

const movieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);
const secretsManager = new SecretsManager({});

const qbittorrentApiBaseUrl = process.env.QBITTORRENT_API_BASE_URL!;
const qbittorrentUsername = process.env.QBITTORRENT_USERNAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const mediaFilesBaseUrl = process.env.MEDIA_FILES_BASE_URL!;

export const handler = async (): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const qbittorrentPassword = secret.QBITTORRENT_PASSWORD!;
  const qbitClient = new QBittorrentClient(qbittorrentApiBaseUrl, qbittorrentUsername, qbittorrentPassword);

  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    try {
      const releaseCandidates = Object.entries(m.releaseCandidates);
      releaseCandidates.sort((a, b) => ReleaseCandidate.compare(b[1], a[1]));
      for (let i = 0; i < releaseCandidates.length; ++i) {
        const rcKey = releaseCandidates[i][0];
        const rc = releaseCandidates[i][1];
        if (ReleaseCandidateStatus.equals(rc.status, ReleaseCandidateStatus.PROCESSED)
        || ReleaseCandidateStatus.equals(rc.status, ReleaseCandidateStatus.PROMOTED)) continue;
        if (rc instanceof TorrentReleaseCandidate) {
          let betterRCAlreadyPromoted = false;
          for (let j = 0; j < i; ++j) {
            const prevRc = releaseCandidates[j][1];
            if (prevRc instanceof TorrentReleaseCandidate /*&& rc.tracker === prevRc.tracker*/
              && ReleaseCandidate.compare(rc, prevRc) < 0 && ReleaseCandidateStatus.equals(prevRc.status, ReleaseCandidateStatus.PROMOTED)) {
              m.setReleaseCandidateStatus(rcKey, ReleaseCandidateStatus.PROCESSED);
              betterRCAlreadyPromoted = true;
              break;
            }
          }
          if (betterRCAlreadyPromoted) continue;
          let torrentInfo = await qbitClient.getTorrentByHash(rc.infoHash);
          if (torrentInfo == null) {
            await qbitClient.addTorrentByUrl(rc.downloadUrl);
            await qbitClient.addTagToTorrent(rc.infoHash, m.id);
            await qbitClient.disableAllFiles(rc.infoHash);
            torrentInfo = (await qbitClient.getTorrentByHash(rc.infoHash)) as TorrentInfo;
          }
          const fileIndex: Nullable<number> = findMediaFile(torrentInfo);
          if (fileIndex == null) {
            m.setReleaseCandidateStatus(rcKey, ReleaseCandidateStatus.PROCESSED);
            continue;
          }
          const file = torrentInfo.files[fileIndex];
          if (file.progress === 1) {
            processMediaFile(m, file.name, rcKey);
            await qbitClient.removeTagFromTorrent(rc.infoHash, m.id);
            if (torrentInfo.tags.length === 1) {
              await qbitClient.deleteTorrentByHash(rc.infoHash);
            }
            break;
          } if (torrentInfo.isStalled && (Date.now() - torrentInfo.addedOn * 1000) > 60 * 60 * 1000) {
            m.setReleaseCandidateStatus(rcKey, ReleaseCandidateStatus.PROCESSED);
            await qbitClient.removeTagFromTorrent(rc.infoHash, m.id);
            if (torrentInfo.tags.length === 1) {
              await qbitClient.deleteTorrentByHash(rc.infoHash);
            }
            continue;
          } else {
            // check available disk space
            await qbitClient.resumeTorrent(rc.infoHash);
            await qbitClient.enableFile(rc.infoHash, file.index);
            break;
          }
        }
      }
      await docClient.put({TableName: movieTableName, Item: m});
    }
    catch (e) {
      console.log(JSON.stringify(e));
    }
  }
  await qbitClient.destroy();
};

function findMediaFile(torrentInfo: Nullable<TorrentInfo>): Nullable<number> {
  if (torrentInfo == null) return null;
  let fileIndex: Nullable<number> = null;
  for (let i = 0; i < torrentInfo.files.length; ++i) {
    const f = torrentInfo.files[i];
    if (f.name.endsWith('.mkv') || f.name.endsWith('.mp4') || f.name.endsWith('.avi')) {
      if (fileIndex != null) return null; // found two files
      fileIndex = i;
    }
  }
  return fileIndex;
}

function processMediaFile(m: Movie, name: string, rcKey: string) {
  console.log(execSync(`/opt/bin/ffprobe -show_streams -loglevel error -print_format json '${mediaFilesBaseUrl}${name}'`).toString());
  // add release to movie
  m.setReleaseCandidateStatus(rcKey, ReleaseCandidateStatus.PROMOTED);
}
