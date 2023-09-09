const { execSync } = require('child_process');
const fs = require('fs');
const sizeOf = require('image-size');

const inputFile = process.argv[2];

const ffprobeCommand = `ffprobe -v quiet -print_format json -show_streams -i ${inputFile}`;

const metadata = JSON.parse(execSync(ffprobeCommand).toString());
const fps = eval(metadata['streams'].filter(_ => _.index === 0)[0]['r_frame_rate']);

const generateThumbnailsCommand = `ffmpeg -i ${inputFile} -vf "select='isnan(prev_selected_t)+gte(t-floor(prev_selected_t),1)',scale=-2:360,setpts=N/${fps}/TB" thumbnail-%06d.jpg > /dev/null 2>&1`;
execSync(generateThumbnailsCommand);

const { width, height } = sizeOf('thumbnail-000001.jpg');
const thumbnailsCount = fs.readdirSync(__dirname).filter(_ => _.startsWith('thumbnail')).length;

const generateSpritesCommand = `magick montage -geometry +0+0 -tile 5x5 thumbnail-*.jpg sprite.jpg`;
execSync(generateSpritesCommand);

execSync(`rm thumbnail-*`);

const webvttFilename = 'thumbnails.vtt';
const webvttFile = fs.createWriteStream(webvttFilename);
webvttFile.write('WEBVTT\n\n');

for (let i = 0; i < thumbnailsCount; ++i) {
  const spriteNumber = Math.floor(i / 25); 
  const startTime = i;
  const endTime = i + 1;
  const spritePositionX = i % 5 * width;
  const spritePositionY = Math.floor(i % 25 / 5) * height;

  webvttFile.write(`${srtTimestamp(startTime)} --> ${srtTimestamp(endTime)}\n`);
  webvttFile.write(`sprite-${spriteNumber}.jpg#xywh=${spritePositionX},${spritePositionY},${width},${height}\n\n`);
}


function srtTimestamp(seconds) {
    var $milliseconds = seconds*1000;
    
    $seconds = Math.floor($milliseconds / 1000);
    $minutes = Math.floor($seconds / 60);
    $hours = Math.floor($minutes / 60);
    $milliseconds = $milliseconds % 1000;
    $seconds = $seconds % 60;
    $minutes = $minutes % 60;
    return ($hours < 10 ? '0' : '') + $hours + ':'
         + ($minutes < 10 ? '0' : '') + $minutes + ':'
         + ($seconds < 10 ? '0' : '') + $seconds + ','
         + ($milliseconds < 100 ? '0' : '') + ($milliseconds < 10 ? '0' : '') + $milliseconds;
}

