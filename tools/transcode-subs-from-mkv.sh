#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <MKV_FILE> <STREAM> <OUTPUT_FILE_NAME>"
  exit 0
fi

MKV_FILE=$1
STREAM=$2
OUTPUT_FILE_NAME=$3

ffmpeg -i ${MKV_FILE} -vn -an -map 0:${STREAM} -codec:s webvtt ${OUTPUT_FILE_NAME}.vtt 

