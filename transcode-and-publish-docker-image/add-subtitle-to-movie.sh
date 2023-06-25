#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename "$0") <AUTH_TOKEN> <MOVIE_ID> <LANG> <RELATIVE_PATH>"
  exit 0
fi

Q62_API_BASE="https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod"

curl -s -X PATCH "${Q62_API_BASE}/addSubtitleToMovie" \
  -H "Authorization: Bearer $1" \
  -H "Content-Type: application/json" \
  -d "{ \"movieId\" : \"$2\", \"lang\" : \"$3\", \"relativePath\" : \"$4\" }"
