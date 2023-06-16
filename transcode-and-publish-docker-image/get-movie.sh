#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename "$0") <MOVIE_ID>"
  exit 0
fi

Q62_API_BASE="https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod"

curl -s "${Q62_API_BASE}/getMovieMetadataForPlayer/${1}"
