#!/bin/bash

if [ $# -eq 0 ]
then
  echo "Usage: $(basename "$0") <AUTH_TOKEN> <ORIGINAL_LOCALE> <ORIGINAL_TITLE> <RELEASE_YEAR"
  exit 0
fi

Q62_API_BASE="https://olz10v4b25.execute-api.eu-west-3.amazonaws.com/prod"

curl -s -X POST "${Q62_API_BASE}/createMovie" \
  -H "Authorization: Bearer $1" \
  -H "Content-Type: application/json" \
  -d "{ \"originalLocale\" : \"$2\", \"originalTitle\" : \"$3\", \"releaseYear\" : $4 }" | tr -d '"'