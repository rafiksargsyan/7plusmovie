import * as core from '@actions/core';
import ffmpeg from 'fluent-ffmpeg';

async function run(): Promise<void> {
  try {
    const mkvFilePath: string = core.getInput('mkvFilePath');
    const outputFolder: string = core.getInput('outputFolder');
    const transcodingSpecBase64Encoded: string = core.getInput('transcodingSpecBase64Encoded');
    const transcodingSpec = JSON.parse(Buffer.from(transcodingSpecBase64Encoded, "base64").toString());
    ffmpeg(mkvFilePath)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run()
