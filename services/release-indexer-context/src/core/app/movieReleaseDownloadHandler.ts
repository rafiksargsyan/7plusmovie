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
import { ReleaseCandidate } from '../domain/entity/ReleaseCandidate';
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { AudioVoiceType } from '../domain/value-object/AudioVoiceType';
import { AudioLang } from '../domain/value-object/AudioLang';

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);
const secretsManager = new SecretsManager({});
const lambdaClient = new LambdaClient({});

const qbittorrentApiBaseUrl = process.env.QBITTORRENT_API_BASE_URL!;
const qbittorrentUsername = process.env.QBITTORRENT_USERNAME!;
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;
const mediaFilesBaseUrl = process.env.MEDIA_FILES_BASE_URL!;
const torrentFilesBaseUrl = process.env.TORRENT_FILES_BASE_URL!;
const mediaFileChacherLambdaName = process.env.MEDIA_FILE_CACHER_LAMBDA_NAME!;

const MIN_AVAILABLE_SPACE_IN_BYTES = 150000000000;
const MAX_FILE_SIZE_IN_BYTES = 45000000000;

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
      if (m.isBlackListed(rcKey)) {
        m.ignoreRc(rcKey);
        continue;
      }
      if (m.isWhiteListed(rcKey)) {
        m.promoteRc(rcKey);
        continue;
      }
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
        const fileIndex: Nullable<number> = findMediaFile(torrentInfo!, m, rc);
        if (fileIndex == null) {
          m.ignoreRc(rcKey);
          await qbitClient.deleteTorrentById(torrentInfo!.id);
          continue;
        }
        const file = torrentInfo!.files[fileIndex];
        if (file.progress === 1) {
          if (! (await processMediaFile(m, file.name, rcKey, rc, file.size))) {
            await qbitClient.deleteTorrentById(torrentInfo!.id);
          }
          break;
        } if ((Date.now() - torrentInfo!.addedOn * 1000) > 60 * 60 * 1000 && (torrentInfo!.isStalled ||
              (torrentInfo!.eta != null && torrentInfo!.eta > 23 * 60 * 60))) {
          m.ignoreRc(rcKey);
          await qbitClient.deleteTorrentById(torrentInfo!.id);
          continue;
        } else {
          const estimatedFreeSpace = await qbitClient.getEstimatedFreeSpace();
          if (estimatedFreeSpace - (file.size * (1 - file.progress)) > MIN_AVAILABLE_SPACE_IN_BYTES) {
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
function findMediaFile(torrentInfo: TorrentInfo,  movie: Movie, rc: ReleaseCandidate): Nullable<number> {
  let candidates: { name: string; size: number; progress: number; index: number; } [] = [];
  for (let i = 0; i < torrentInfo.files.length; ++i) {
    const f = torrentInfo.files[i];
    const name = f.name.toLowerCase();
    if ((name.endsWith('.mkv') || name.endsWith('.mp4') || name.endsWith('.avi')) && !name.includes("sample")) {
      candidates.push(f);
    }
  }
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    if (rc.radarrIsUnknown) return null;
    return candidates[0].index;
  }
  const candidateScores = candidates.map(c => ({ index: c.index, score: movie.calculateMatchScore(c.name) }))
  .sort((a, b) => b.score - a.score);
  if (candidateScores[0].score > candidateScores[1].score && candidateScores[0].score > 0) return candidateScores[0].index;
  return null;
}

// add media file name to release
async function processMediaFile(m: Movie, name: string, rcKey: string, rc: TorrentReleaseCandidate, size: number) {
  try {
    if (size > MAX_FILE_SIZE_IN_BYTES) {
      throw new Error('Too big file');
    }
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
        ++numAudioStreams;
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
        if (titleStr != null && titleStr.toLowerCase().includes("commentary")) continue;
        const author = resolveAudioAuthor(titleStr, rc.tracker);
        let lang = resolveAudioLang(langStr, m.originalLocale, titleStr, author, numUndefinedAudioStreams, numAudioStreams, rc.radarrLanguages);
        if (lang == null) continue;
        const voiceType = resolveVoiceType(titleStr, lang, m.originalLocale, author);
        // Sometimes mkv creators forget to setup correct lang code for original one
        if (AudioVoiceType.compare(voiceType, AudioVoiceType.ORIGINAL) === 0) {
          lang = AudioLang.fromKeyOrThrow(m.originalLocale.key);
        }
        const am = new AudioMetadata(s.index, s.channels, bitRate, lang,
          resolveVoiceType(titleStr, lang, m.originalLocale, author), author);
        release.addAudioMetadata(am);
      }
      if (s.codec_type === "subtitle") {
        if (s.codec_name !== "subrip" && s.codec_name !== "ass" && s.codec_name !== "webvtt") continue;
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
      release.cachedMediaFileRelativePath = m.id + "/" + rc.infoHash + name.substring(name.lastIndexOf('.'));
      if (m.addRelease(rc.infoHash, release)) {
        m.promoteRc(rcKey);

        const cacheLambdaParams = {
          destinationPath: release.cachedMediaFileRelativePath,
          sourceUrl: mediaFilesBaseUrl + encodeURIComponent(name),
          torrentId: rc.infoHash,
          size: size
        }
        const lambdaParams = {
          FunctionName: mediaFileChacherLambdaName,
          InvocationType: InvocationType.Event,
          Payload: JSON.stringify(cacheLambdaParams)
        };
        const invokeCommand = new InvokeCommand(lambdaParams);
        try {
          await lambdaClient.send(invokeCommand);
        } catch (e) {
          console.log(e);
        }

        return true;
      }
      m.ignoreRc(rcKey);
    }
  } catch (e) {
    m.ignoreRc(rcKey);
    console.log(e);
  }
  return false;
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
