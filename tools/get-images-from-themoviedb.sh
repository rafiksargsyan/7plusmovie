#!/bin/bash

IMAGE_BASE_URL=https://image.tmdb.org/t/p/original

function strip_first_and_last() {
  STR=$1
  tmp="${STR%\"}"
  echo "${tmp#\"}"
}

if [ $# -eq 0 ]
then
  echo "Usage: $(basename $0) <THE_MOVIE_DB_API_KEY> <THE_MOVIE_DB_MOVIE_ID>"
  exit 0
fi

API_KEY=$1
MOVIE_ID=$2

MOVIE_EN_US=$(curl -s "https://api.themoviedb.org/3/movie/${MOVIE_ID}?api_key=${API_KEY}&language=en-US")

ORIGINAL_TITLE=$(jq '.original_title' <<< "${MOVIE_EN_US}")
ORIGINAL_LANG=$(jq '.original_language' <<< "${MOVIE_EN_US}")
RELEASE_DATE=$(jq '.release_date' <<< "${MOVIE_EN_US}")
POSTER_IMAGE_EN_US=$(strip_first_and_last $(jq '.poster_path' <<< "${MOVIE_EN_US}"))
TITLE_EN_US=$(jq '.title' <<< "${MOVIE_EN_US}")

BACKDROP_PATH=$(strip_first_and_last $(jq '.backdrop_path' <<< "${MOVIE_EN_US}"))

echo "originalTitle = ${ORIGINAL_TITLE}"
echo "originalLang  = ${ORIGINAL_LANG}"
echo "releaseDate   = ${RELEASE_DATE}"
echo "title-EN_US   = ${TITLE_EN_US}"

curl -s ${IMAGE_BASE_URL}${BACKDROP_PATH} --output backdropImage.jpg
curl -s ${IMAGE_BASE_URL}${POSTER_IMAGE_EN_US} --output posterImagePortrait-EN_US.jpg

MOVIE_RU=$(curl -s "https://api.themoviedb.org/3/movie/${MOVIE_ID}?api_key=${API_KEY}&language=ru")
POSTER_IMAGE_RU=$(strip_first_and_last $(jq '.poster_path' <<< "${MOVIE_RU}"))
TITLE_RU=$(jq '.title' <<< "${MOVIE_RU}")

echo "title-RU     = ${TITLE_RU}"

curl -s ${IMAGE_BASE_URL}${POSTER_IMAGE_RU} --output posterImagePortrait-RU.jpg

