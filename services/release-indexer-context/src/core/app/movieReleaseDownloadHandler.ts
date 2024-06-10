import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { QBittorrentClient } from '../../adapters/QBittorrentClient';
import { execSync } from 'child_process';
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
import { TorrentTracker } from '../domain/value-object/TorrentTracker';
import { resolveAudioLang } from '../domain/service/resolveAudioLang';
import { resolveSubsLang } from '../domain/service/resolveSubsLang';
import { resolveSubsAuthor } from '../domain/service/resolveSubsAuthor';
import { compareReleaseCandidates } from '../domain/service/compareReleaseCandidates';

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
const torrentFilesBaseUrl = process.env.TORRENT_FILES_BASE_URL!;

export const handler = async (event): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
  const secret = JSON.parse(secretStr.SecretString!);
  const qbittorrentPassword = secret.QBITTORRENT_PASSWORD!;
  const qbitClient = new QBittorrentClient(qbittorrentApiBaseUrl, qbittorrentUsername, qbittorrentPassword);
  const m: Movie = await movieRepo.getMovieById(JSON.parse(event.Records[0].Sns.Message).movieId);
  const releaseCandidates = Object.entries(m.releaseCandidates);
  releaseCandidates.sort((a, b) => compareReleaseCandidates(b[1], a[1]));
  
  for (let i = 0; i < releaseCandidates.length; ++i) {
    try {
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
            && TorrentTracker.fromKeyOrThrow(rc.tracker.key).isLanguageSpecific()
            && compareReleaseCandidates(rc, prevRc) < 0 && prevRc.isPromoted()) {
            m.ignoreRc(rcKey);
            betterRCAlreadyPromoted = true;
            break;
          }
        }
        if (prevRcNotProcessed) break;
        let torrentInfo = await qbitClient.getTorrentByHash(rc.infoHash);
        if (betterRCAlreadyPromoted) {
          if (torrentInfo?.tags.length === 1 && torrentInfo?.tags[0] === m.id) {
            await qbitClient.deleteTorrentByHash(rc.infoHash);
          }
          continue;
        }
        if (torrentInfo == null) {
          if (rc.downloadUrl.startsWith("magnet")) {
            torrentInfo = await addMagnetAndWait(qbitClient, rc.downloadUrl, rc.infoHash);
          } else {
            torrentInfo = await addTorrentAndWait(qbitClient, `${torrentFilesBaseUrl}/${rc.downloadUrl}`, rc.infoHash);
          }
          await qbitClient.disableAllFiles(rc.infoHash);
        }
        await qbitClient.addTagToTorrent(rc.infoHash, m.id);
        torrentInfo = await qbitClient.getTorrentByHash(rc.infoHash) as TorrentInfo;
        const fileIndex: Nullable<number> = findMediaFile(torrentInfo, m.releaseYear);
        if (fileIndex == null) {
          m.ignoreRc(rcKey);
          if (torrentInfo?.tags.length === 1 && torrentInfo?.tags[0] === m.id) {
            await qbitClient.deleteTorrentByHash(rc.infoHash);
          }
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
    } catch (e) {
      console.log(e);
    } 
  } 
  await movieRepo.saveMovie(m);
  await qbitClient.destroy();
};

// We might also need to use title to better much, but with release year most of the cases
// should be covered.
function findMediaFile(torrentInfo: TorrentInfo, releaseYear: number): Nullable<number> {
  let candidates: { name: string; size: number; progress: number; index: number; } [] = [];
  for (let i = 0; i < torrentInfo.files.length; ++i) {
    const f = torrentInfo.files[i];
    if (f.name.endsWith('.mkv') || f.name.endsWith('.mp4') || f.name.endsWith('.avi')) {
      candidates.push(f);
    }
  }
  if (candidates.length === 1) return candidates[0].index;
  let candidates2: { name: string; size: number; progress: number; index: number; } [] = [];
  for (let c of candidates) {
    if (c.name.includes(releaseYear.toString()) && ! c.name.toLowerCase().includes("sample")) candidates2.push(c);
  }
  if (candidates2.length === 1) return candidates2[0].index;
  return null;
}

// add media file name to release
function processMediaFile(m: Movie, name: string, rcKey: string, rc: TorrentReleaseCandidate) {
  try {
    const streams = JSON.parse(execSync(`/opt/bin/ffprobe -show_streams -loglevel error -print_format json '${mediaFilesBaseUrl}${name}'`).toString());
    const release = new TorrentRelease(false, rc.ripType, rc.resolution, rc.infoHash, name, rc.tracker, rc.downloadUrl);
    let numAudioStreams = 0;
    let numUndefinedAudioStreams = 0;
    for (let s of streams.streams) {
      if (s.codec_type === "audio") {
        ++numAudioStreams
        if (s.tags?.language == null || s.tags?.language === "und") {
          ++numUndefinedAudioStreams;
        }
      }
    }
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
        const author = resolveAudioAuthor(titleStr, rc.tracker);
        let lang = resolveAudioLang(langStr, m.originalLocale, titleStr, author, numUndefinedAudioStreams, numAudioStreams, rc.radarrLanguages);
        if (lang == null) continue;
        const am = new AudioMetadata(s.index, s.channels, bitRate, lang,
          resolveVoiceType(titleStr, lang, m.originalLocale), author);
        release.addAudioMetadata(am);
      }
      if (s.codec_type === "subtitle") {
        if (s.codec_name !== "subrip") continue; // add also other text subtitle formats
        let langStr = s.tags?.language;
        let titleStr = s.tags?.title;
        let lang = resolveSubsLang(titleStr, langStr, m.originalLocale);
        if (lang == null) continue;
        const sm = new SubsMetadata(s.index, lang, SubsType.fromTitle(titleStr), resolveSubsAuthor(titleStr, rc.tracker));
        release.addSubsMetadata(sm);
      }
    }
    if (release.audios.length === 0) {
      m.ignoreRc(rcKey);
    } else {
      m.addRelease(rc.infoHash, release);
      m.promoteRc(rcKey);
    }
  } catch (e) {
    m.ignoreRc(rcKey);;
    console.log(e);
  }
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
    throw new TimedOutWaitingTorrentToBeAddedError();
  }
  return torrentInfo;
}

async function addMagnetAndWait(qbitClient: TorrentClientInterface, downloadUrl: string, hash: string): Promise<TorrentInfo> {
  await qbitClient.addTorrentByUrl(downloadUrl);
  let torrentInfo;
  let tryCount = 3;
  while (torrentInfo == null && tryCount-- > 0) {
    await new Promise(r => setTimeout(r, 5000));
    torrentInfo = await qbitClient.getTorrentByHash(hash);
  }
  if (torrentInfo == null) {
    throw new TimedOutWaitingTorrentToBeAddedError();
  }
  tryCount = 10;
  await qbitClient.resumeTorrent(hash);
  while (torrentInfo.files.length === 0 && tryCount-- > 0) {
    await new Promise(r => setTimeout(r, 1000));
    torrentInfo = await qbitClient.getTorrentByHash(hash);
  }
  await qbitClient.pauseTorrent(hash);
  if (torrentInfo.files.length === 0) {
    throw new TimedOutWaitingTorrentFilesError();
  }
  return torrentInfo;
}

class TimedOutWaitingTorrentToBeAddedError extends Error {}

class TimedOutWaitingTorrentFilesError extends Error {}
