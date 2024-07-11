import * as core from '@actions/core';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import sizeOf from 'image-size';

async function run(): Promise<void> {
  try {
    const videoFilePath: string = core.getInput('videoFilePath');
    const outputFolder: string = core.getInput('outputFolder');
    const resolutionsBase64Encoded: string = core.getInput('resolutionsBase64Encoded');
    const resolutions: number[] = JSON.parse(Buffer.from(resolutionsBase64Encoded, 'base64').toString());
    const videoFileAbsolutePath = path.resolve(videoFilePath);
    const outputFolderAbsolutePath = path.resolve(outputFolder);
    
    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_streams -i ${videoFileAbsolutePath}`;
    const metadata = JSON.parse(execSync(ffprobeCommand).toString());
    const fps = eval(metadata['streams'].filter((_: { index: number; }) => _.index === 0)[0]['r_frame_rate']);

    for (const res of resolutions) {
      const [spriteR, spriteC] = resolveSpriteSize(res);
      const spriteS = spriteR * spriteC;
      const resAbsolutePath = path.resolve(outputFolderAbsolutePath, `${res}`);
      fs.mkdirSync(resAbsolutePath);
      process.chdir(resAbsolutePath);

      const generateThumbnailsCommand = `ffmpeg -i ${videoFileAbsolutePath} -vf "select='isnan(prev_selected_t)+gte(t-floor(prev_selected_t),1)',scale=-2:${res},setpts=N/${fps}/TB"  thumbnail-%06d.png > /dev/null 2>&1`;
      execSync(generateThumbnailsCommand);
  
      const { width, height } = sizeOf('thumbnail-000001.png');
      if (width == undefined) {
        throw new FailedToResolveThumbnailWidthError();
      }
      if (height == undefined) {
        throw new FailedToResolveThumbnailHeightError();
      }
      const thumbnailsCount = fs.readdirSync(resAbsolutePath).filter(_ => _.startsWith('thumbnail')).length;
  
      const generateSpritesCommand = `magick montage -quality 20 -geometry +0+0 -tile ${spriteC}x${spriteR} thumbnail-*.png sprite.jpg`;
      execSync(generateSpritesCommand);
  
      execSync(`rm thumbnail-*`);

      if (thumbnailsCount <= spriteS) {
        execSync(`mv sprite.jpg sprite-0.jpg`);
      }
  
      const webvttFilename = 'thumbnails.vtt';
      const webvttFile = fs.createWriteStream(webvttFilename);
      webvttFile.write('WEBVTT\n\n');
  
      for (let i = 0; i < thumbnailsCount; ++i) {
        const spriteNumber = Math.floor(i / spriteS); 
        const startTime = i;
        const endTime = i + 1;
        const spritePositionX = i % spriteC * width;
        const spritePositionY = Math.floor(i % spriteS / spriteC) * height;
  
        webvttFile.write(`${vttTimestamp(startTime)} --> ${vttTimestamp(endTime)}\n`);
        webvttFile.write(`sprite-${spriteNumber}.jpg#xywh=${spritePositionX},${spritePositionY},${width},${height}\n\n`);
      }
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function vttTimestamp(seconds: number) {
  let milliseconds = seconds*1000;
  
  seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  milliseconds = milliseconds % 1000;
  seconds = seconds % 60;
  minutes = minutes % 60;
  return (hours < 10 ? '0' : '') + hours + ':'
    + (minutes < 10 ? '0' : '') + minutes + ':'
    + (seconds < 10 ? '0' : '') + seconds + '.'
    + (milliseconds < 100 ? '0' : '') + (milliseconds < 10 ? '0' : '') + milliseconds;
}

run();

class FailedToResolveThumbnailHeightError extends Error {};

class FailedToResolveThumbnailWidthError extends Error {};

function resolveSpriteSize(resolution: number) {
  if (resolution <= 60) {
    return [12, 12];
  }
  if (resolution <= 120) {
    return [6, 6];
  }
  return [3, 3];
}
