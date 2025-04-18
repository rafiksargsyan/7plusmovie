import * as core from '@actions/core'
import path from 'path'
import fs from 'fs'
import {execSync} from 'child_process'
import {Lang} from './Lang'

const WORKING_DIR_NAME = '.transcoding-job-work-dir'

interface AudioTranscodeSpec {
  stream: number
  bitrate: string
  channels: number
  lang: string
  fileName: string
  name: string
}

interface TextTranscodeSpec {
  stream: number
  name: string
  fileName: string
  lang: string
}

interface VideoTranscodeSpec {
  resolutions: {fileName: string; resolution: number}[] // 360, 480, 720, 1080, etc.
  stream: number
}

async function run(): Promise<void> {
  try {
    const mkvFilePath: string = core.getInput('mkvFilePath')
    const outputFolder: string = core.getInput('outputFolder')
    const transcodingSpecBase64Encoded: string = core.getInput(
      'transcodingSpecBase64Encoded'
    )
    const transcodingSpec = JSON.parse(
      Buffer.from(transcodingSpecBase64Encoded, 'base64').toString()
    )
    // TODO: Get transcoding spec json schema from CDN and validate
    const mkvFileAbsolutePath = path.resolve(mkvFilePath)
    const outputFolderAbsolutePath = path.resolve(outputFolder)

    if (!fs.existsSync(WORKING_DIR_NAME)) {
      fs.mkdirSync(WORKING_DIR_NAME)
    } else {
      const files = fs.readdirSync(WORKING_DIR_NAME)
      for (const file of files) {
        const filePath = path.join(WORKING_DIR_NAME, file)
        fs.unlinkSync(filePath)
      }
    }
    const workdirAbsolutePath = path.resolve(WORKING_DIR_NAME)
    process.chdir(WORKING_DIR_NAME)

    const vodFolderAbsolutePath = path.resolve(outputFolderAbsolutePath, 'vod')
    fs.mkdirSync(vodFolderAbsolutePath)
    const subtitlesFolderAbsolutePath = path.resolve(
      outputFolderAbsolutePath,
      'subtitles'
    )
    fs.mkdirSync(subtitlesFolderAbsolutePath)

    const videoTranscodeSpec: VideoTranscodeSpec = transcodingSpec['video']

    for (const x of videoTranscodeSpec.resolutions) {
      transcodeVideoFromMkv(
        mkvFileAbsolutePath,
        videoTranscodeSpec.stream,
        x.resolution,
        x.fileName
      )
    }

    let audioTranscodeSpecs: AudioTranscodeSpec[] = transcodingSpec['audio']
    if (audioTranscodeSpecs == null) audioTranscodeSpecs = []
    let textTranscodeSpecs: TextTranscodeSpec[] = transcodingSpec['text']
    if (textTranscodeSpecs == null) textTranscodeSpecs = []

    audioTranscodeSpecs.forEach(_ => {
      transcodeAudioFromMkv(
        mkvFileAbsolutePath,
        _.stream,
        _.channels,
        _.bitrate,
        _.fileName
      )
    })

    textTranscodeSpecs.forEach(_ => {
      transcodeSubsFromMkv(mkvFileAbsolutePath, _.stream, _.fileName)
    })

    if (textTranscodeSpecs.length !== 0) {
      execSync(`cp ./*.vtt ${subtitlesFolderAbsolutePath}`)
    }
    process.chdir(vodFolderAbsolutePath)

    let shakaPackagerCommand = 'shaka-packager '

    for (const x of videoTranscodeSpec.resolutions) {
      transcodeVideoFromMkv(
        mkvFileAbsolutePath,
        videoTranscodeSpec.stream,
        x.resolution,
        x.fileName
      )
      shakaPackagerCommand += `in=${path.resolve(
        workdirAbsolutePath,
        x.fileName
      )},stream=video,output=${x.fileName} `
    }

    audioTranscodeSpecs.forEach(_ => {
      shakaPackagerCommand += `in=${path.resolve(
        workdirAbsolutePath,
        _.fileName
      )},stream=audio,output=${_.fileName},lang=${
        Lang.fromKeyOrThrow(_.lang).lang
      },hls_group_id=audio,hls_name='${_.name}',dash_label='${_.name}' `
    })

    textTranscodeSpecs.forEach(_ => {
      shakaPackagerCommand += `in=${path.resolve(
        workdirAbsolutePath,
        _.fileName
      )},stream=text,output=${_.fileName},lang=${
        Lang.fromKeyOrThrow(_.lang).lang
      },hls_group_id=subtitle,hls_name='${_.name}',dash_label='${_.name}' `
    })

    shakaPackagerCommand += `--mpd_output ${path.resolve(
      vodFolderAbsolutePath,
      'manifest.mpd'
    )} --hls_master_playlist_output ${path.resolve(
      vodFolderAbsolutePath,
      'master.m3u8'
    )}`

    execSync(`eval "${shakaPackagerCommand}"`, {
      maxBuffer: 10 * 1024 * 1024 // 10 MB
    })

    if (textTranscodeSpecs.length !== 0) {
      execSync('sed -i "/shaka-packager/d" ./*.vtt')
    }
    execSync('sed -i "/shaka-packager/d" ./*.mpd')
    execSync('sed -i "/shaka-packager/d" ./*.m3u8')
    core.setOutput(
      'videoFileName',
      videoTranscodeSpec.resolutions
        .sort((a, b) => b.resolution - a.resolution)
        .at(0)?.fileName
    )
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

function transcodeSubsFromMkv(
  mkvFilePath: string,
  stream: number,
  fileName: string
): void {
  let command = `ffmpeg -i ${mkvFilePath} -vn -an -map 0:${stream} -codec:s webvtt ${fileName} > /dev/null 2>&1`
  execSync(command)
  // https://github.com/shaka-project/shaka-packager/issues/1018
  command = `echo >> ${fileName}`
  execSync(command)
  command = `echo '99:00:00.000 --> 99:00:01.000' >> ${fileName}`
  execSync(command)
  command = `echo 'dummy' >> ${fileName}`
  execSync(command)
  command = `echo >> ${fileName}`
  execSync(command)
}

function transcodeAudioFromMkv(
  mkvFilePath: string,
  stream: number,
  channels: number,
  bitrate: string,
  fileName: string
): void {
  let command = `ffmpeg -i ${mkvFilePath} -map 0:${stream} -ac ${channels} -c aac -ab ${bitrate} `
  command += `-vn -sn ${fileName} > /dev/null 2>&1`
  execSync(command)
}

function transcodeVideoFromMkv(
  mkvFilePath: string,
  stream: number,
  resolution: number,
  fileName: string
): void {
  let level, profile, crf, maxRate, bufSize
  if (resolution <= 360) {
    level = '3.0'
    profile = 'baseline'
    crf = 18
    maxRate = '600k'
    bufSize = '1200k'
  } else if (resolution <= 480) {
    level = '3.1'
    profile = 'main'
    crf = 18
    maxRate = '1200k'
    bufSize = '2400k'
  } else if (resolution <= 720) {
    level = '4.0'
    profile = 'main'
    crf = 18
    maxRate = '3000k'
    bufSize = '6000k'
  } else if (resolution <= 1080) {
    level = '4.2'
    profile = 'high'
    crf = 19
    maxRate = '5000k'
    bufSize = '10000k'
  } else {
    throw new UnsupportedVideoResolutionError()
  }
  let videoSettings = `scale=-2:${resolution},format=yuv420p`
  if (isHdr(mkvFilePath)) {
    videoSettings = `zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,${videoSettings}`
  }
  let command = `ffmpeg -i ${mkvFilePath} -an -sn -c:v:${stream} libx264 -profile:v ${profile} -level:v ${level} `
  command += `-x264opts 'keyint=120:min-keyint=120:no-scenecut:open_gop=0' -map_chapters -1 -crf ${crf} -maxrate ${maxRate} `
  command += `-bufsize ${bufSize} -preset veryslow -tune film -vf "${videoSettings}" `
  command += `${fileName} > /dev/null 2>&1`
  execSync(command)
}

function isHdr(mkvFilePath: string): boolean {
  const command = `ffprobe -v error -select_streams v:0 -show_entries stream=color_transfer,color_space,color_primaries -of json '${mkvFilePath}'`
  const output = execSync(command)
  const outputStr = output.toString('utf-8')
  return outputStr.includes('2020')
}

run()

class UnsupportedVideoResolutionError extends Error {}
