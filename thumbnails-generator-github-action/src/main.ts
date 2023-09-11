import * as core from '@actions/core';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import sizeOf from 'image-size';

async function run(): Promise<void> {
  try {
    const videoFilePath: string = core.getInput('videoFilePath');
    const outputFolder: string = core.getInput('outputFolder');
    const videoFileAbsolutePath = path.resolve(videoFilePath);
    const outputFolderAbsolutePath = path.resolve(outputFolder);
    
    process.chdir(outputFolderAbsolutePath);

    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_streams -i ${videoFileAbsolutePath}`;
    const metadata = JSON.parse(execSync(ffprobeCommand).toString());
    const fps = eval(metadata['streams'].filter((_: { index: number; }) => _.index === 0)[0]['r_frame_rate']);

    const generateThumbnailsCommand = `ffmpeg -i ${videoFileAbsolutePath} -vf "select='isnan(prev_selected_t)+gte(t-floor(prev_selected_t),1)',scale=-2:240,setpts=N/${fps}/TB" thumbnail-%06d.jpg > /dev/null 2>&1`;
    execSync(generateThumbnailsCommand);

    const { width, height } = sizeOf('thumbnail-000001.jpg');
    if (width == undefined) {
      throw new FailedToResolveThumbnailWidthError();
    }
    if (height == undefined) {
      throw new FailedToResolveThumbnailHeightError();
    }
    const thumbnailsCount = fs.readdirSync(outputFolderAbsolutePath).filter(_ => _.startsWith('thumbnail')).length;

    const generateSpritesCommand = `magick montage -geometry +0+0 -tile 5x3 thumbnail-*.jpg sprite.jpg`;
    execSync(generateSpritesCommand);

    execSync(`rm thumbnail-*`);

    const webvttFilename = 'thumbnails.vtt';
    const webvttFile = fs.createWriteStream(webvttFilename);
    webvttFile.write('WEBVTT\n\n');

    for (let i = 0; i < thumbnailsCount; ++i) {
      const spriteNumber = Math.floor(i / 15); 
      const startTime = i;
      const endTime = i + 1;
      const spritePositionX = i % 5 * width;
      const spritePositionY = Math.floor(i % 15 / 5) * height;

      webvttFile.write(`${srtTimestamp(startTime)} --> ${srtTimestamp(endTime)}\n`);
      webvttFile.write(`sprite-${spriteNumber}.jpg#xywh=${spritePositionX},${spritePositionY},${width},${height}\n\n`);
    }

  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function srtTimestamp(seconds: number) {
  let milliseconds = seconds*1000;
  
  seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  milliseconds = milliseconds % 1000;
  seconds = seconds % 60;
  minutes = minutes % 60;
  return (hours < 10 ? '0' : '') + hours + ':'
    + (minutes < 10 ? '0' : '') + minutes + ':'
    + (seconds < 10 ? '0' : '') + seconds + ','
    + (milliseconds < 100 ? '0' : '') + (milliseconds < 10 ? '0' : '') + milliseconds;
}

run();

class FailedToResolveThumbnailHeightError extends Error {};

class FailedToResolveThumbnailWidthError extends Error {};
