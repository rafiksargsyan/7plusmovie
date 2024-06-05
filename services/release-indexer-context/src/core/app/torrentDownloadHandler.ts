import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { QBittorrentClient } from '../../adapters/QBittorrentClient';
import { execSync } from 'child_process';
import { ReleaseCandidate } from '../domain/entity/ReleaseCandidate';
import { TorrentReleaseCandidate } from '../domain/entity/TorrentReleaseCandidate';
import { Nullable } from '../../Nullable';
import { TorrentClientInterface, TorrentInfo } from '../ports/TorrentClientInterface';
import { Movie } from '../domain/aggregate/Movie';
import { TorrentRelease } from '../domain/entity/TorrentRelease';
import { AudioMetadata } from '../domain/value-object/AudioMetadata';
import { resolveVoiceType } from '../domain/service/resolveVoiceType';
import { resolveAudioAuthor } from '../domain/service/resolveAudioAuthor';
import { SubsMetadata } from '../domain/value-object/SubsMetadata';
import { SubsType } from '../domain/value-object/SubsType';
import { SubsAuthor } from '../domain/value-object/SubsAuthor';
import { TorrentTracker } from '../domain/value-object/TorrentTracker';
import { resolveAudioLang } from '../domain/service/resolveAudioLang';
import { resolveSubsLang } from '../domain/service/resolveSubsLang';

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
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
        const rc = m.releaseCandidates[releaseCandidates[i][0]];
        if (rc.isProcessed()) continue;
        if (rc instanceof TorrentReleaseCandidate) {
          let betterRCAlreadyPromoted = false;
          let prevRcNotProcessed = false;
          for (let j = 0; j < i; ++j) {
            const prevRc = m.releaseCandidates[releaseCandidates[j][0]];
            if (!prevRc.isProcessed()) {
              prevRcNotProcessed = true;
              break;
            }
            if (prevRc instanceof TorrentReleaseCandidate && TorrentTracker.equals(rc.tracker, prevRc.tracker)
              && ReleaseCandidate.compare(rc, prevRc) < 0 && prevRc.isPromoted()) {
              m.ignoreRc(rcKey);
              betterRCAlreadyPromoted = true;
              break;
            }
          }
          if (prevRcNotProcessed) break;
          let torrentInfo = await qbitClient.getTorrentByHash(rc.infoHash);
          console.log("torrentinfo");
          console.log(JSON.stringify(torrentInfo));
          console.log(`betterRCAlreadyPromoted=${betterRCAlreadyPromoted}`);
          if (betterRCAlreadyPromoted) {
            if (torrentInfo?.tags.length === 1 && torrentInfo?.tags[0] === m.id) {
              await qbitClient.deleteTorrentByHash(rc.infoHash);
            }
            continue;
          }
          if (torrentInfo == null) {
            torrentInfo = await addTorrentAndWait(qbitClient, rc.downloadUrl, rc.infoHash);
            await qbitClient.disableAllFiles(rc.infoHash);
          }
          await qbitClient.addTagToTorrent(rc.infoHash, m.id);
          torrentInfo = await qbitClient.getTorrentByHash(rc.infoHash) as TorrentInfo;
          const fileIndex: Nullable<number> = findMediaFile(torrentInfo);
          if (fileIndex == null) {
            m.ignoreRc(rcKey);
            continue;
          }
          const file = torrentInfo.files[fileIndex];
          if (file.progress === 1) {
            processMediaFile(m, file.name, rcKey, rc);
            await qbitClient.removeTagFromTorrent(rc.infoHash, m.id);
            if (torrentInfo.tags.length === 1) {
              await qbitClient.deleteTorrentByHash(rc.infoHash);
            }
            break;
          } if (torrentInfo.isStalled && (Date.now() - torrentInfo.addedOn * 1000) > 60 * 60 * 1000) {
            m.ignoreRc(rcKey);
            await qbitClient.removeTagFromTorrent(rc.infoHash, m.id);
            if (torrentInfo.tags.length === 1) {
              await qbitClient.deleteTorrentByHash(rc.infoHash);
            }
            continue;
          } else {
            const estimatedFreeSpace = await qbitClient.getEstimatedFreeSpace();
            if (estimatedFreeSpace - (file.size * (1 - file.progress)) > 150000000000) {
              await qbitClient.resumeTorrent(rc.infoHash);
              await qbitClient.enableFile(rc.infoHash, file.index);
            }
          }
        }
      }
      await movieRepo.saveMovie(m);
    }
    catch (e) {
      console.log(e);
    }
  }
  await qbitClient.destroy();
};

// need to improve the logic by using release year, title to better much media files
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

// add media file name to release
function processMediaFile(m: Movie, name: string, rcKey: string, rc: TorrentReleaseCandidate) {
  const streams = JSON.parse(execSync(`/opt/bin/ffprobe -show_streams -loglevel error -print_format json '${mediaFilesBaseUrl}${name}'`).toString());
  console.log(JSON.stringify(streams));
  const release = new TorrentRelease(rc.ripType, rc.resolution, rc.infoHash, name, rc.tracker, rc.downloadUrl);
  for (let s of streams.streams) {
    if (s.index === 0 && s.codec_type !== "video") {
      m.ignoreRc(rcKey);
      return;
    }
    if (s.codec_type === "audio") {
      let channels = s.channels;
      if (channels == null) continue;
      let bitRate = s.bit_rate;
      if (bitRate == null) {
        if (channels >= 6) bitRate = 640000;
        if (channels >= 2) bitRate = 192000;
        if (channels === 1) bitRate = 128000;
      };
      let langStr = s.tags?.language;
      let titleStr = s.tags?.title;
      let lang = resolveAudioLang(langStr, m.originalLocale, titleStr);
      if (lang == null) continue;
      const am = new AudioMetadata(s.index, s.channels, bitRate, lang,
        resolveVoiceType(titleStr, lang, m.originalLocale), resolveAudioAuthor(titleStr, rc.tracker));
      release.addAudioMetadata(am);
    }
    if (s.codec_type === "subtitle") {
      if (s.codec_name !== "subrip") continue; // add also other text subtitle formats
      let langStr = s.tags?.language;
      let titleStr = s.tags?.title;
      let lang = resolveSubsLang(titleStr, langStr, m.originalLocale);
      if (lang == null) continue;
      const sm = new SubsMetadata(s.index, lang, SubsType.fromTitle(titleStr), SubsAuthor.fromTitle(titleStr)); // todo
      release.addSubsMetadata(sm);
    }
  }
  m.addRelease(rc.infoHash, release);
  m.promoteRc(rcKey);
}

async function addTorrentAndWait(qbitClient: TorrentClientInterface, downloadUrl: string, hash: string): Promise<TorrentInfo> {
  await qbitClient.addTorrentByUrl(downloadUrl);
  let torrentInfo;
  let tryCount = 3;
  while (torrentInfo == null && tryCount-- > 0) {
    await new Promise(r => setTimeout(r, 5000));
    torrentInfo = await qbitClient.getTorrentByHash(hash);
  }
  if (torrentInfo == null) {
    throw new TimedOutWaitingTorrentToBeAdded();
  }
  return torrentInfo;
}

class TimedOutWaitingTorrentToBeAdded extends Error {}
