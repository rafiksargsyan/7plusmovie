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
    const rcKey = releaseCandidates[i][0];
    const rc = m.releaseCandidates[releaseCandidates[i][0]];
    try {
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
        if (betterRCAlreadyPromoted) {
          continue;
        }
        let torrentInfo = await qbitClient.getTorrentById(rc.infoHash);
        if (torrentInfo == null) {
          if (rc.downloadUrl.startsWith("magnet")) {
            torrentInfo = await addMagnetAndWait(qbitClient, rc.downloadUrl, rc.infoHash);
          } else {
            torrentInfo = await qbitClient.addTorrentByUrlOrThrow(`${torrentFilesBaseUrl}/${rc.downloadUrl}`, rc.infoHash);
          }
          await qbitClient.disableAllFiles(torrentInfo!.id);
        }
        const fileIndex: Nullable<number> = findMediaFile(torrentInfo!, m.releaseYear, m.originalLocale.lang === "en" ? m.originalTitle : null);
        if (fileIndex == null) {
          m.ignoreRc(rcKey);
          await  qbitClient.deleteTorrentById(torrentInfo!.id);
          continue;
        }
        const file = torrentInfo!.files[fileIndex];
        if (file.progress === 1) {
          processMediaFile(m, file.name, rcKey, rc, file.size);
          await qbitClient.deleteTorrentById(torrentInfo!.id);
          break;
        } if ((Date.now() - torrentInfo!.addedOn * 1000) > 60 * 60 * 1000 && (torrentInfo!.isStalled ||
              (torrentInfo!.eta != null && torrentInfo!.eta > 23 * 60 * 60))) {
          m.ignoreRc(rcKey);
          await  qbitClient.deleteTorrentById(torrentInfo!.id);
          continue;
        } else {
          const estimatedFreeSpace = await qbitClient.getEstimatedFreeSpace();
          if (estimatedFreeSpace - (file.size * (1 - file.progress)) > 150000000000) {
            await qbitClient.resumeTorrent(torrentInfo!.id);
            await qbitClient.enableFile(torrentInfo!.id, file.index);
          }
        }
      }
    } catch (e) {
      m.ignoreRc(rcKey);
      if (rc instanceof TorrentReleaseCandidate) {
        try {
          await qbitClient.deleteTorrentById(rc.infoHash);
        } catch (e) {
          console.log(e);
        }
      }
      console.log(e);
    } 
  } 
  await movieRepo.saveMovie(m);
  await qbitClient.destroy();
};

// You might think searching for release year should be enough, but it is not. For example, there were
// two matrix movies in the same year 2003
function findMediaFile(torrentInfo: TorrentInfo, releaseYear: number, englishTitle: Nullable<string>): Nullable<number> {
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
  if (candidates2.length === 0) return null;
  if (englishTitle != null) {
    const candidateScore: { [key:string]: { score: number, index: number } } = {};
    candidates2.forEach(c => { candidateScore[c.name] = { score: 0, index: c.index } });
    const tokens = englishTitle.split(/[\s:,'.()-]+/).filter(x => x.length >= 3).map(x => x.toLowerCase());
    for (let x in candidateScore) {
      for (let t of tokens) {
        if (x.toLowerCase().includes(t)) {
          candidateScore[x].score = candidateScore[x].score + 1;
        }
      }
    }
    const candidateScoreEntries = Object.entries(candidateScore).sort((a, b) => b[1].score - a[1].score);
    if (candidateScoreEntries[0][1].score > candidateScoreEntries[1][1].score) {
      return candidateScoreEntries[0][1].index;
    }
  }
  return null;
}

// add media file name to release
function processMediaFile(m: Movie, name: string, rcKey: string, rc: TorrentReleaseCandidate, size: number) {
  try {
    const streams = JSON.parse(execSync(`/opt/bin/ffprobe -show_streams -loglevel error -print_format json '${mediaFilesBaseUrl}${name}'`).toString());
    const durationStr = execSync(`ffprobe -i '${mediaFilesBaseUrl}${name}' -show_entries format=duration -v quiet -of csv="p=0"`).toString();
    const duration = Number.parseFloat(durationStr);
    if (!Number.isNaN(duration) && m.runtimeSeconds != null && Math.abs(duration - m.runtimeSeconds) > 0.2 * m.runtimeSeconds) {
      throw new Error ('The release candidate duration is considerably different from official runtime');
    }
    const release = new TorrentRelease(false, rc.ripType, rc.resolution, rc.infoHash, name, rc.tracker, rc.downloadUrl, size);
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

async function addMagnetAndWait(qbitClient: TorrentClientInterface, downloadUrl: string, hash: string): Promise<TorrentInfo> {
  let torrentInfo: Nullable<TorrentInfo> = await qbitClient.addTorrentByUrlOrThrow(downloadUrl, hash);
  let tryCount = 10;
  await qbitClient.resumeTorrent(torrentInfo.id);
  while (torrentInfo?.files.length === 0 && tryCount-- > 0) {
    await new Promise(r => setTimeout(r, 1000));
    torrentInfo = await qbitClient.getTorrentById(hash);
  }
  await qbitClient.pauseTorrent(hash);
  if (torrentInfo?.files.length === 0) {
    throw new TimedOutWaitingTorrentFilesError();
  }
  return torrentInfo!;
}

class TimedOutWaitingTorrentFilesError extends Error {}
