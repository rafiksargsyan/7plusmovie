import * as core from '@actions/core';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { SubsLangCode, SubsLangCodes } from './SubsLangCodes';
import { AudioLangCode, AudioLangCodes } from './AudioLangCodes';

const WORKING_DIR_NAME = '.transcoding-job-work-dir';

interface AudioTranscodeSpec {
  stream: number;
  bitrate: string;
  channels: number;
  lang: keyof typeof AudioLangCodes;
}

interface TextTranscodeSpec {
  stream: number;
  forced: boolean;
  lang: keyof typeof SubsLangCodes;
}

async function run(): Promise<void> {
  try {
    const mkvFilePath: string = core.getInput('mkvFilePath');
    const outputFolder: string = core.getInput('outputFolder');
    const transcodingSpecBase64Encoded: string = core.getInput('transcodingSpecBase64Encoded');
    const transcodingSpec = JSON.parse(Buffer.from(transcodingSpecBase64Encoded, "base64").toString());
    // TODO: Get transcoding spec json schema from CDN and validate
    const mkvFileAbsolutePath = path.resolve(mkvFilePath);
    const outputFolderAbsolutePath = path.resolve(outputFolder);
    
    if (!fs.existsSync(WORKING_DIR_NAME)) {
      fs.mkdirSync(WORKING_DIR_NAME);
    } else {
      const files = fs.readdirSync(WORKING_DIR_NAME);
      for (const file of files) {
        const filePath = path.join(WORKING_DIR_NAME, file);
        fs.unlinkSync(filePath);
      }
    }
    const workdirAbsolutePath = path.resolve(WORKING_DIR_NAME);
    process.chdir(WORKING_DIR_NAME);
     
    const vodFolderAbsolutePath = path.resolve(outputFolderAbsolutePath, '/vod');
    fs.mkdirSync(vodFolderAbsolutePath);
    const subtitlesFolderAbsolutePath = path.resolve(outputFolderAbsolutePath, '/subtitles');
    fs.mkdirSync(subtitlesFolderAbsolutePath);

    console.log(`vodFolderAbsolutePath = ${vodFolderAbsolutePath}`);

    transcodeVideoFromMkv(mkvFileAbsolutePath, 0, 540);
    transcodeVideoFromMkv(mkvFileAbsolutePath, 0, 720);
    transcodeVideoFromMkv(mkvFileAbsolutePath, 0, 1080);

    let audioTranscodeSpecs: AudioTranscodeSpec[] = transcodingSpec['audio'];
    if (audioTranscodeSpecs == undefined) audioTranscodeSpecs = [];
    let textTranscodeSpecs: TextTranscodeSpec[] = transcodingSpec['text'];
    if (textTranscodeSpecs == undefined) textTranscodeSpecs = [];
    const defaultAudioTrack: number | undefined = transcodingSpec['defaultAudioTrack'];
    const defaultTextTrack: number | undefined = transcodingSpec['defaultTextTrack'];
    
    audioTranscodeSpecs.forEach(_ => {
      transcodeAudioFromMkv(mkvFileAbsolutePath, _.stream, _.channels, _.bitrate, new AudioLangCode(_.lang));
    });

    textTranscodeSpecs.forEach(_ => {
      transcodeSubsFromMkv(mkvFileAbsolutePath, _.stream,  new SubsLangCode(_.lang));
    })

    execSync(`cp ./*.vtt ${subtitlesFolderAbsolutePath}`);

    process.chdir(vodFolderAbsolutePath);

    let shakaPackagerCommand = "shaka-packager ";
    shakaPackagerCommand += `in=${path.resolve(workdirAbsolutePath, "h264_main_540p_18.mp4")},stream=video,output=h264_main_540p_18.mp4 `;
    shakaPackagerCommand += `in=${path.resolve(workdirAbsolutePath, "h264_main_720p_18.mp4")},stream=video,output=h264_main_720p_18.mp4 `;
    shakaPackagerCommand += `in=${path.resolve(workdirAbsolutePath, "h264_high_1080p_19.mp4")},stream=video,output=h264_high_1080p_19.mp4 `;
    
    audioTranscodeSpecs.forEach(_ => {
      const audioFileName = `aac_${_.channels}_${_.bitrate}_${AudioLangCodes[_.lang]['langTag']}.mp4`
      let hlsName: string = AudioLangCodes[_.lang]['displayName'];
      if (_.channels === 6) hlsName += ' (5.1)';
      shakaPackagerCommand += `in=${path.resolve(workdirAbsolutePath, audioFileName)},stream=audio,output=${audioFileName},lang=${AudioLangCodes[_.lang]['langTag']}-x-${_.channels},hls_group_id=audio,hls_name='${hlsName}' `;
    })
    
    textTranscodeSpecs.forEach(_ => {
      const textFileName = `${SubsLangCodes[_.lang]['langTag']}.vtt`
      shakaPackagerCommand += `in=${path.resolve(workdirAbsolutePath, textFileName)},stream=text,output=${textFileName},lang=${SubsLangCodes[_.lang]['langTag']},hls_group_id=subtitle,hls_name='${SubsLangCodes[_.lang]['displayName']}' `;
    })

    if (defaultAudioTrack != undefined) {
      shakaPackagerCommand += `--default_language ${AudioLangCodes[audioTranscodeSpecs[defaultAudioTrack].lang].langTag}-x-${audioTranscodeSpecs[defaultAudioTrack].channels} `;
    }

    if (defaultTextTrack != undefined) {
      shakaPackagerCommand += `--default_text_language ${SubsLangCodes[textTranscodeSpecs[defaultTextTrack].lang].langTag} `;
    }

    shakaPackagerCommand += "--mpd_output manifest.mpd --hls_master_playlist_output master.m3u8";

    console.log(`shakaPackagerCommand = ${shakaPackagerCommand}`); 

    execSync(`eval "${shakaPackagerCommand}"`);

    execSync('sed -i "/shaka-packager/d" ./*.vtt');
    execSync('sed -i "/shaka-packager/d" ./*.mpd');
    execSync('sed -i "/shaka-packager/d" ./*.m3u8');


    textTranscodeSpecs.forEach(_ =>  {
      const langTag = SubsLangCodes[_.lang]['langTag'];
      const langDisplayName = SubsLangCodes[_.lang]['displayName'];
      const command = `sed -i 's/.*contentType=\\"text\\".*lang=\\"${langTag}\\".*/&\\n      \\<Label\\>${langDisplayName}\\<\\/Label\\>/' manifest.mpd`;
      execSync(command);
    });

    audioTranscodeSpecs.forEach(_ => {
      const langTag = AudioLangCodes[_.lang]['langTag'] + `-x-${_.channels}`;
      let langDisplayName = AudioLangCodes[_.lang]['displayName'];
      if (_.channels === 6) {
        langDisplayName += ' (5.1)';
      }
      const command = `sed -i 's/.*contentType=\\"audio\\".* lang=\\"${langTag}\\".*/&\\n      \\<Label\\>${langDisplayName}\\<\\/Label\\>/' manifest.mpd`;
      execSync(command);
    });

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function transcodeSubsFromMkv(mkvFilePath: string, stream: number, lang: SubsLangCode) {
  const command = `ffmpeg -i ${mkvFilePath} -vn -an -map 0:${stream} -codec:s webvtt ${SubsLangCodes[lang.code]['langTag']}.vtt > /dev/null 2>&1`;
  execSync(command);
}

function transcodeAudioFromMkv(mkvFilePath: string, stream: number, channels: number, bitrate: string, lang: AudioLangCode) {
  let command = `ffmpeg -i ${mkvFilePath} -map 0:${stream} -ac ${channels} -c aac -ab ${bitrate} `;
  command += `-vn -sn aac_${channels}_${bitrate}_${AudioLangCodes[lang.code]['langTag']}.mp4 > /dev/null 2>&1`;
  execSync(command);
}

function transcodeVideoFromMkv(mkvFilePath: string, stream: number, resolution: number) {
  let level, profile, crf, maxRate, bufSize;
  switch (resolution) {
    case 540:
      level = '3.1'; profile = 'main'; crf = 18; maxRate = '1500k'; bufSize = '3000k';
      break;
    case 720:
      level = '4.0'; profile = 'main'; crf = 18; maxRate = '3000k'; bufSize = '6000k';
      break;
    case 1080:
      level = '4.2'; profile = 'high'; crf = 19; maxRate = '5000k'; bufSize = '10000k';
      break;
    default:
      throw new UnsupportedVideoResolutionError();
  }
  let command = `ffmpeg -i ${mkvFilePath} -an -sn -c:v:${stream} libx264 -profile:v ${profile} -level:v ${level} `;
  command += `-x264opts 'keyint=120:min-keyint=120:no-scenecut:open_gop=0' -map_chapters -1 -crf ${crf} -maxrate ${maxRate} `;
  command += `-bufsize ${bufSize} -preset veryslow -tune film -vf "scale=-2:540,format=yuv420p" `;
  command += `h264_${profile}_${resolution}p_${crf}.mp4 > /dev/null 2>&1`;  
  execSync(command);
}

run();

class UnsupportedVideoResolutionError extends Error {};