#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <MKV_FILE> <STREAM> <CHANNELS> <BITRATE> <OUTPUT_FILE_NAME_SUFFIX>"
  echo "Stereo recommended bitrate: 192k"
  exit 0
fi

MKV_FILE=$1
STREAM=$2
CHANNELS=$3
BITRATE=$4
OUTPUT_FILE_NAME_SUFFIX=$5

ffmpeg -i ${MKV_FILE} -map 0:${STREAM} -ac ${CHANNELS} -c aac -ab ${BITRATE} -vn -sn aac_${CHANNELS}_${BITRATE}_${OUTPUT_FILE_NAME_SUFFIX}.mp4 > /dev/null 2>&1
