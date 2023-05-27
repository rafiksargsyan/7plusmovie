#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <MKV_FILE>"
  exit 0
fi

MKV_FILE=$1

ffprobe ${MKV_FILE} 2>&1 | grep Stream

