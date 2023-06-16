#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <MKV_FILE> <STREAM> <RESOLUTION>"
  exit 0
fi

MKV_FILE=$1
STREAM=$2
RESOLUTION=$3

[[ "${RESOLUTION}" == "540" ]] && ffmpeg -i ${MKV_FILE} -an -sn -c:v:${STREAM} libx264 -profile:v main -level:v 3.1 -x264opts 'keyint=120:min-keyint=120:no-scenecut:open_gop=0' -map_chapters -1 -crf 18 -maxrate 1500k -bufsize 3000k -preset veryslow -tune film -vf "scale=-2:540,format=yuv420p"  h264_main_540p_18.mp4

[[ "${RESOLUTION}" == "720" ]] && ffmpeg -i ${MKV_FILE} -an -sn -c:v:${STREAM} libx264 -profile:v main -level:v 4.0 -x264opts 'keyint=120:min-keyint=120:no-scenecut:open_gop=0' -map_chapters -1 -crf 18 -maxrate 3000k -bufsize 6000k -preset veryslow -tune film -vf "scale=-2:720,format=yuv420p"  h264_main_720p_18.mp4

[[ "${RESOLUTION}" == "1080" ]] && ffmpeg -i ${MKV_FILE} -an -sn -c:v:${STREAM} libx264 -profile:v high -level:v 4.2 -x264opts 'keyint=120:min-keyint=120:no-scenecut:open_gop=0' -map_chapters -1 -crf 19 -maxrate 5000k -bufsize 10000k -preset veryslow -tune film -vf "scale=-2:1080,format=yuv420p"  h264_high_1080p_19.mp4

