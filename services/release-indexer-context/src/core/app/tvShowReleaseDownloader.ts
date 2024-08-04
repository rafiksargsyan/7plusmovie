import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { SecretsManager } from '@aws-sdk/client-secrets-manager'
import { execSync } from 'child_process'
import { TorrentReleaseCandidate } from '../domain/entity/TorrentReleaseCandidate'
import { Nullable } from '../../Nullable'
import { TorrentInfo } from '../ports/ITorrentClient'
import { TorrentRelease } from '../domain/entity/TorrentRelease'
import { AudioMetadata } from '../domain/value-object/AudioMetadata'
import { resolveVoiceType } from '../domain/service/resolveVoiceType'
import { resolveAudioAuthor } from '../domain/service/resolveAudioAuthor'
import { SubsMetadata } from '../domain/value-object/SubsMetadata'
import { SubsType } from '../domain/value-object/SubsType'
import { TorrentTracker } from '../domain/value-object/TorrentTracker'
import { resolveAudioLang } from '../domain/service/resolveAudioLang'
import { resolveSubsLang } from '../domain/service/resolveSubsLang'
import { resolveSubsAuthor } from '../domain/service/resolveSubsAuthor'
import { compareReleaseCandidates } from '../domain/service/compareReleaseCandidates'
import { InvocationType, InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda'
import { AudioVoiceType } from '../domain/value-object/AudioVoiceType'
import { AudioLang } from '../domain/value-object/AudioLang'
import { TvShowRepository } from '../../adapters/TvShowRepository'
import { TvShow } from '../domain/aggregate/TvShow'
import { QBittorrentClientV2 } from '../../adapters/QBittorrentClientV2'
import { ITorrentClient, TorrentRuntimeError } from '../ports/ITorrentClient'

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
}

const translateConfig = { marshallOptions }

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig)
const tvShowRepo = new TvShowRepository(docClient)
const secretsManager = new SecretsManager({})
const lambdaClient = new LambdaClient({})

const qbittorrentApiBaseUrl = process.env.QBITTORRENT_API_BASE_URL!
const qbittorrentUsername = process.env.QBITTORRENT_USERNAME!
const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!
const mediaFilesBaseUrl = process.env.MEDIA_FILES_BASE_URL!
const torrentFilesBaseUrl = process.env.TORRENT_FILES_BASE_URL!
const mediaFileChacherLambdaName = process.env.TVSHOW_MEDIA_FILE_CACHER_LAMBDA_NAME!

const MIN_AVAILABLE_SPACE_IN_BYTES = 150000000000
const MAX_FILE_SIZE_IN_BYTES = 45000000000

export const handler = async (event: { tvShowId: string, seasonNumber: number, episodeNumber: number }): Promise<void> => {
  const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId})
  const secret = JSON.parse(secretStr.SecretString!)
  const qbittorrentPassword = secret.QBITTORRENT_PASSWORD!
  const qbitClient = new QBittorrentClientV2(qbittorrentApiBaseUrl, qbittorrentUsername, qbittorrentPassword)
  const tvShow = await tvShowRepo.getEpisode(event.tvShowId, event.seasonNumber,  event.episodeNumber)
  const episode = tvShow.seasons[0].episodes[0]
  const releaseCandidates = Object.entries(episode.releaseCandidates)
  releaseCandidates.sort((a, b) => compareReleaseCandidates(b[1], a[1]))
  
  for (let i = 0; i < releaseCandidates.length; ++i) {
    const rcKey = releaseCandidates[i][0]
    const rc = episode.releaseCandidates[rcKey]
    const tag = `S${event.seasonNumber}E${event.episodeNumber}`
    try {
      if (rc.isProcessed()) continue
      if (tvShow.isBlackListed(event.seasonNumber, event.episodeNumber, rcKey)) {
        tvShow.ignoreRc(event.seasonNumber, event.episodeNumber, rcKey)
        continue
      }
      if (tvShow.isWhiteListed(event.seasonNumber, event.episodeNumber, rcKey)) {
        tvShow.promoteRc(event.seasonNumber, event.episodeNumber, rcKey)
        continue
      }
      if (rc instanceof TorrentReleaseCandidate) {
        let betterRCAlreadyPromoted = false
        let prevRcNotProcessed = false
        for (let j = 0; j < i; ++j) {
          const prevRcKey = releaseCandidates[j][0]  
          const prevRc = episode.releaseCandidates[prevRcKey]
          if (!prevRc.isProcessed()) {
            prevRcNotProcessed = true
            break
          }
          if (prevRc instanceof TorrentReleaseCandidate && TorrentTracker.equals(rc.tracker, prevRc.tracker)
            && TorrentTracker.fromKeyOrThrow(rc.tracker.key).isLanguageSpecific()
            && compareReleaseCandidates(rc, prevRc) < 0 && prevRc.isPromoted()) {
            tvShow.ignoreRc(event.seasonNumber, event.episodeNumber, rcKey)
            betterRCAlreadyPromoted = true
            break
          }
        }
        if (prevRcNotProcessed) break
        if (betterRCAlreadyPromoted) {
          continue
        }
        let torrentInfo = await qbitClient.getTorrentById(rc.infoHash)
        if (torrentInfo == null) {
          let downloadUrl
          if (rc.downloadUrl.startsWith('magnet')) {
            downloadUrl = rc.downloadUrl
          } else {
            downloadUrl = `${torrentFilesBaseUrl}/${rc.downloadUrl}`
          }
          torrentInfo = await qbitClient.addTorrentByUrl(rc.downloadUrl, rc.infoHash, [tag])
          await qbitClient.disableAllFiles(torrentInfo!.id)
        }
        await qbitClient.addTag(torrentInfo.id, tag)
        const fileIndex: Nullable<number> = findMediaFile(torrentInfo!, event.seasonNumber, event.episodeNumber)
        if (fileIndex == null) {
          tvShow.ignoreRc(event.seasonNumber, event.episodeNumber, rcKey)
          await removeTagAndDelete(qbitClient, torrentInfo!, tag)
          continue
        }
        const file = torrentInfo!.files[fileIndex]
        if (file.progress === 1) {
          if (!(await processMediaFile(tvShow, event.seasonNumber, event.episodeNumber, file.name, rcKey, rc, file.size, episode.runtimeSeconds, tag))) {
            await removeTagAndDelete(qbitClient, torrentInfo!, tag)
          }
          break
        } if ((Date.now() - torrentInfo!.addedOn * 1000) > 60 * 60 * 1000 && (torrentInfo!.isStalled ||
              (torrentInfo!.eta != null && torrentInfo!.eta > 23 * 60 * 60))) {
          tvShow.ignoreRc(event.seasonNumber, event.episodeNumber, rcKey)
          await removeTagAndDelete(qbitClient, torrentInfo!, tag)
          continue
        } else {
          const estimatedFreeSpace = await qbitClient.getEstimatedFreeSpace()
          if (estimatedFreeSpace - (file.size * (1 - file.progress)) > MIN_AVAILABLE_SPACE_IN_BYTES) {
            await qbitClient.resumeTorrent(torrentInfo!.id)
            await qbitClient.enableFile(torrentInfo!.id, file.index)
          }
        }
      }
    } catch (e) {
      if (e instanceof TorrentRuntimeError) {
        const msg = `Got torrent runtime error, will retry on the next run: ${e.message}`
        console.error(msg)
        return
      }
      tvShow.ignoreRc(event.seasonNumber, event.episodeNumber, rcKey)
      if (rc instanceof TorrentReleaseCandidate) {
        try {
          const torrentInfo = await qbitClient.getTorrentById(rc.infoHash)
          if (torrentInfo != null) {
            await removeTagAndDelete(qbitClient, torrentInfo, tag)
          }
        } catch (e) {
          console.log(e)
        }
      }
      console.log(e)
      console.log(`Got error when processing RC=${JSON.stringify(rc)}`)
    } 
  } 
  await tvShowRepo.save(tvShow, false, [], { [event.seasonNumber]: [event.episodeNumber] } )
  await qbitClient.destroy()
}


function findMediaFile(torrentInfo: TorrentInfo, seasonNumber: number, episodeNumber: number): Nullable<number> {
  let candidates: { name: string; size: number; progress: number; index: number; } [] = []
  const regex = new RegExp(String.raw`s0*${seasonNumber}e0*${episodeNumber}`)
    const regex2 = new RegExp(String.raw`0*${seasonNumber}x0*${episodeNumber}`)
  for (let i = 0; i < torrentInfo.files.length; ++i) {
    const f = torrentInfo.files[i]
    if (f.name == null) continue;
    const name = f.name.toLowerCase()
    if ((name.endsWith('.mkv') || name.endsWith('.mp4') || name.endsWith('.avi')) && !name.includes("sample")
        && (name.match(regex) != null || name.match(regex2) != null)) {
      candidates.push(f)
    }
  }
  if (candidates.length > 1) {
    candidates = candidates.filter(c => {
      const baseName = c.name.substring(c.name.lastIndexOf('/') + 1)
      return baseName.match(regex) != null || baseName.match(regex2) != null
    })
  }
  if (candidates.length === 1) {
    return candidates[0].index
  }
  console.warn(`Could not match a media file for torrentInfo=${JSON.stringify(torrentInfo)},s=${seasonNumber},e=${episodeNumber}`)
  return null
}

async function processMediaFile(tvShow: TvShow, seasonNumber: number, episodeNumber: number, name: string, rcKey: string,
    rc: TorrentReleaseCandidate, size: number, runtimeSeconds: Nullable<number>, tag: string) {
  if (size > MAX_FILE_SIZE_IN_BYTES) {
    console.warn(`Too big media file: RC=${JSON.stringify(rc)},s=${seasonNumber},e=${episodeNumber}`)
    tvShow.ignoreRc(seasonNumber, episodeNumber, rcKey)
    return false
  }
  const streams = JSON.parse(execSync(`/opt/bin/ffprobe -show_streams -loglevel error -print_format json '${mediaFilesBaseUrl}${name}'`).toString())
  const durationStr = execSync(`ffprobe -i '${mediaFilesBaseUrl}${name}' -show_entries format=duration -v quiet -of csv="p=0"`).toString()
  const duration = Number.parseFloat(durationStr)
  if (!Number.isNaN(duration) && runtimeSeconds != null && Math.abs(duration - runtimeSeconds) > 0.15 * runtimeSeconds) {
    console.warn(`The release candidate duration is considerably different from official runtime: RC=${JSON.stringify(rc)},s=${seasonNumber},e=${episodeNumber}`)
    tvShow.ignoreRc(seasonNumber, episodeNumber, rcKey)
    return false
  }
  const release = new TorrentRelease(false, rc.ripType, rc.resolution, rc.infoHash, name, rc.tracker, rc.downloadUrl, size)
  let numAudioStreams = 0
  let numUndefinedAudioStreams = 0
  for (let s of streams.streams) {
    if (s.codec_type === "audio") {
      ++numAudioStreams
      if (s.tags?.language == null || s.tags?.language === "und") {
        ++numUndefinedAudioStreams
      }
    }
  }
  for (let s of streams.streams) {
    if (s.index === 0 && s.codec_type !== "video") {
      console.warn(`Video must be first stream: RC=${JSON.stringify(rc)},s=${seasonNumber},e=${episodeNumber}`)
      tvShow.ignoreRc(seasonNumber, episodeNumber, rcKey)
      return false
    }
    if (s.codec_type === "audio") {
      let channels = s.channels
      if (channels == null) continue
      let bitRate = s.bit_rate
      if (bitRate == null) {
        if (channels >= 6) bitRate = 640000
        if (channels >= 2) bitRate = 192000
        if (channels === 1) bitRate = 128000
      }
      let langStr = s.tags?.language
      let titleStr = s.tags?.title
      let titleStrLC = titleStr?.toLowerCase()
      if (titleStr != null && (titleStrLC.includes("commentary") ||  titleStrLC.includes("comentary"))) continue
        const author = resolveAudioAuthor(titleStr, rc.tracker)
        let lang = resolveAudioLang(langStr, tvShow.originalLocale, titleStr, author,
            numUndefinedAudioStreams, numAudioStreams, rc.radarrLanguages)
        if (lang == null) continue
        const voiceType = resolveVoiceType(titleStr, lang, tvShow.originalLocale, author)
        // Sometimes mkv creators forget to setup correct lang code for original one
        if (AudioVoiceType.compare(voiceType, AudioVoiceType.ORIGINAL) === 0) {
          lang = AudioLang.fromKeyOrThrow(tvShow.originalLocale.key)
        }
        const am = new AudioMetadata(s.index, s.channels, bitRate, lang,
          resolveVoiceType(titleStr, lang, tvShow.originalLocale, author), author)
        release.addAudioMetadata(am)
    }
    if (s.codec_type === "subtitle") {
      if (s.codec_name !== "subrip" && s.codec_name !== "ass" && s.codec_name !== "webvtt") continue
      let langStr = s.tags?.language
      let titleStr = s.tags?.title
      let lang = resolveSubsLang(titleStr, langStr, tvShow.originalLocale)
      if (lang == null) continue
      const sm = new SubsMetadata(s.index, lang, SubsType.fromTitle(titleStr), resolveSubsAuthor(titleStr, rc.tracker))
      release.addSubsMetadata(sm)
    }
  }
  if (release.audios.length === 0) {
    console.warn(`No audio found: RC=${JSON.stringify(rc)},s=${seasonNumber},e=${episodeNumber}`)
    tvShow.ignoreRc(seasonNumber, episodeNumber, rcKey)
    return false
  } else {
    const extension = name.substring(name.lastIndexOf('.') + 1)
    release.cachedMediaFileRelativePath = `${tvShow.id}/${seasonNumber}/${episodeNumber}/${rc.infoHash}.${extension}`
    if (tvShow.addRelease(seasonNumber, episodeNumber, rc.infoHash, release)) {
      tvShow.promoteRc(seasonNumber, episodeNumber, rcKey)
      const cacheLambdaParams = {
        destinationPath: release.cachedMediaFileRelativePath,
        sourceUrl: mediaFilesBaseUrl + encodeURIComponent(name),
        torrentId: rc.infoHash,
        tag: tag
      }
      const lambdaParams = {
        FunctionName: mediaFileChacherLambdaName,
        InvocationType: InvocationType.Event,
        Payload: JSON.stringify(cacheLambdaParams)
      }
      const invokeCommand = new InvokeCommand(lambdaParams)
      try {
        await lambdaClient.send(invokeCommand)
      } catch (e) {
        console.log(e)
      }
      return true
    }
    tvShow.ignoreRc(seasonNumber, episodeNumber, rcKey)
  }
  return false
}

async function removeTagAndDelete(qbitClient: ITorrentClient, ti: TorrentInfo, tag: string) { 
  ti = await qbitClient.removeTag(ti.id, tag)
  if (ti.tags.length === 0) {
    await qbitClient.deleteTorrentById(ti.id)
  }  
}
