#!/bin/bash

usage () {
  echo "Export the following environment variables before running the script:"
  echo "    MKV_FILE_PATH"
  echo "    SPEC_FILE_PATH"
  echo "    MEDIA_FILES_S3_BUCKET"
  echo "    ADMIN_USER_POOL_CLI_CLIENT_ID"
  echo "    Q62_ADMIN_USERNAME"
  echo "    Q62_ADMIN_PASSWORD"
  echo "    THEMOVIEDB_API_KEY"
}

if [[ $1 == "-h" ]]; then
  usage
  exit 0
fi

MKV_FILE=bundle.mkv
SPEC_FILE=spec.json

WORKING_DIR_NAME=transcode-and-publish-movie-work-dir
mkdir $WORKING_DIR_NAME > /dev/null 2>&1 || true
rm -r ${WORKING_DIR_NAME:?}/* > /dev/null 2>&1 || true
cp "$MKV_FILE_PATH" $WORKING_DIR_NAME/$MKV_FILE
cp "$SPEC_FILE_PATH" $WORKING_DIR_NAME/$SPEC_FILE
cd $WORKING_DIR_NAME || exit 1
mkdir s3
mkdir s3/vod
mkdir s3/subtitles

transcode-video-from-mkv $MKV_FILE 0 540 > 540.log 2>&1 &
PID540=$!
transcode-video-from-mkv $MKV_FILE 0 720 > 720.log 2>&1 &
PID720=$!
transcode-video-from-mkv $MKV_FILE 0 1080 > 1080.log 2>&1 &
PID1080=$!

wait $PID540
wait $PID720
wait $PID1080

NUM_AUDIO_STREAMS=$(jq ".transcodeSpec.audio | length" $SPEC_FILE)
for (( i=0; i < NUM_AUDIO_STREAMS; ++i )); do
  stream=$(jq ".transcodeSpec.audio[$i].stream" $SPEC_FILE)
  bitrate=$(jq -r ".transcodeSpec.audio[$i].bitrate" $SPEC_FILE)
  channels=$(jq ".transcodeSpec.audio[$i].channels" $SPEC_FILE)
  lang_code=$(jq -r ".transcodeSpec.audio[$i].langCode" $SPEC_FILE)
  transcode-audio-from-mkv $MKV_FILE "$stream" "$channels" "$bitrate" "$lang_code" > audio.log 2>&1
done

NUM_TEXT_STREAMS=$(jq ".transcodeSpec.text | length" $SPEC_FILE)
for (( i=0; i < NUM_TEXT_STREAMS; ++i )); do
  stream=$(jq ".transcodeSpec.text[$i].stream" $SPEC_FILE)
  forced=$(jq ".transcodeSpec.text[$i].forced" $SPEC_FILE)
  lang_code=$(jq -r ".transcodeSpec.text[$i].langCode" $SPEC_FILE)
  [ "$forced" = "true" ] && file_name="${lang_code}-forced" || file_name="${lang_code}"
  transcode-subs-from-mkv $MKV_FILE $stream $file_name > text.log 2>&1
done

cp ./*.vtt s3/subtitles

cd s3/vod || exit 1
COMMAND="shaka-packager "
COMMAND="${COMMAND}in=../../h264_main_540p_18.mp4,stream=video,output=h264_main_540p_18.mp4 "
COMMAND="${COMMAND}in=../../h264_main_720p_18.mp4,stream=video,output=h264_main_720p_18.mp4 "
COMMAND="${COMMAND}in=../../h264_high_1080p_19.mp4,stream=video,output=h264_high_1080p_19.mp4 "

for (( i=0; i < NUM_AUDIO_STREAMS; ++i )); do
  stream=$(jq ".transcodeSpec.audio[$i].stream" ../../$SPEC_FILE)
  bitrate=$(jq -r ".transcodeSpec.audio[$i].bitrate" ../../$SPEC_FILE)
  channels=$(jq ".transcodeSpec.audio[$i].channels" ../../$SPEC_FILE)
  lang_code=$(jq -r ".transcodeSpec.audio[$i].langCode" ../../$SPEC_FILE)
  file_name="aac_${channels}_${bitrate}_${lang_code}.mp4"
  lang="${lang_code}-x-${channels}"
  [ "$lang_code" = "ru" ] && lang_name="Русский"
  [ "$lang_code" = "en-US" ] && lang_name="English (US)"
  [ "$channels" = "6" ] && lang_name="${lang_name} (5.1)"
  COMMAND="${COMMAND}in=../../${file_name},stream=audio,output=${file_name},lang=${lang},hls_group_id=audio,hls_name='${lang_name}' "
done

for (( i=0; i < NUM_TEXT_STREAMS; ++i )); do
  stream=$(jq ".transcodeSpec.text[$i].stream" ../../$SPEC_FILE)
  forced=$(jq ".transcodeSpec.text[$i].forced" ../../$SPEC_FILE)
  lang_code=$(jq -r ".transcodeSpec.text[$i].langCode" ../../$SPEC_FILE)
  [ "$forced" = "true" ] && lang="${lang_code}-x-forced" || lang="${lang_code}"
  [ "$forced" = "true" ] && file_name="${lang_code}-forced.vtt" || file_name="${lang_code}.vtt"
  [ "$lang_code" = "ru" ] && lang_name="Русский"
  [ "$lang_code" = "en-US" ] && lang_name="English (US)"
  [ "$forced" = "true" ] && [ "$lang_code" = "ru" ] && lang_name="${lang_name} (форсированный)"
  [ "$forced" = "true" ] && [ "$lang_code" = "en-US" ] && lang_name="${lang_name} (forced)"
  COMMAND="${COMMAND}in=../../${file_name},stream=text,output=${file_name},lang=${lang},hls_group_id=subtitle,hls_name='${lang_name}' "
done

default_lang=$(jq ".transcodeSpec.defaultLang" ../../$SPEC_FILE)
[ "${default_lang}" = "null" ] || COMMAND="${COMMAND} --default_language ${default_lang} "

default_text_lang=$(jq ".transcodeSpec.defaultTextLang" ../../$SPEC_FILE)
[ "${default_text_lang}" = "null" ] || COMMAND="${COMMAND} --default_text_language ${default_text_lang} "

COMMAND="${COMMAND}--mpd_output manifest.mpd --hls_master_playlist_output master.m3u8"

eval "$COMMAND > ../../shaka-packager.log 2>&1"

sed -i "/shaka-packager/d" ./*.vtt
sed -i "/shaka-packager/d" ./*.mpd
sed -i "/shaka-packager/d" ./*.m3u8

sed -i 's/.*contentType=\"text\".*lang=\"ru\".*/&\n      \<Label\>Русский\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"text\".* lang=\"ru-x-forced\".*/&\n      \<Label\>Русский (форсированный)\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"text\".*lang=\"en-US\".*/&\n      \<Label\>English (US)\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"text\".* lang=\"en-US-x-forced\".*/&\n      \<Label\>English (US) (forced)\<\/Label\>/' manifest.mpd

sed -i 's/.*contentType=\"audio\".*lang=\"ru-x-1\".*/&\n      \<Label\>Русский\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"audio\".* lang=\"ru-x-2\".*/&\n      \<Label\>Русский\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"audio\".* lang=\"ru-x-6\".*/&\n      \<Label\>Русский (5.1)\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"audio\".*lang=\"en-US-x-1\".*/&\n      \<Label\>English\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"audio\".* lang=\"en-US-x-2\".*/&\n      \<Label\>English\<\/Label\>/' manifest.mpd
sed -i 's/.*contentType=\"audio\".* lang=\"en-US-x-6\".*/&\n      \<Label\>English US (5.1)\<\/Label\>/' manifest.mpd

cd ../..

THEMOVIEDB_API_BASE="https://api.themoviedb.org/3"
THEMOVIEDB_IMAGE_BASE="https://image.tmdb.org/t/p/original"

THEMOVIEDB_MOVIE_ID=$(jq ".themoviedbId" $SPEC_FILE)
THEMOVIEDB_MOVIE_EN_US=$(curl -s "${THEMOVIEDB_API_BASE}/movie/${THEMOVIEDB_MOVIE_ID}?api_key=${THEMOVIEDB_API_KEY}&language=en-US")
THEMOVIEDB_MOVIE_RU=$(curl -s "${THEMOVIEDB_API_BASE}/movie/${THEMOVIEDB_MOVIE_ID}?api_key=${THEMOVIEDB_API_KEY}&language=ru")

ORIGINAL_TITLE=$(jq -r '.original_title' <<< "${THEMOVIEDB_MOVIE_EN_US}")
ORIGINAL_LANG=$(jq -r '.original_language' <<< "${THEMOVIEDB_MOVIE_EN_US}")
RELEASE_DATE=$(jq -r '.release_date' <<< "${THEMOVIEDB_MOVIE_EN_US}")
RELEASE_YEAR=${RELEASE_DATE%%-*}
TITLE_EN_US=$(jq -r '.title' <<< "${THEMOVIEDB_MOVIE_EN_US}")
TITLE_RU=$(jq -r '.title' <<< "${THEMOVIEDB_MOVIE_RU}")
POSTER_PATH_EN_US=$(jq -r '.poster_path' <<< "${THEMOVIEDB_MOVIE_EN_US}")
POSTER_PATH_RU=$(jq -r '.poster_path' <<< "${THEMOVIEDB_MOVIE_RU}")
BACKDROP_PATH=$(jq -r '.backdrop_path' <<< "${THEMOVIEDB_MOVIE_EN_US}")

[ "${ORIGINAL_LANG}" == "en" ] || [ "${ORIGINAL_LANG}" == "en-US" ] || [ "${ORIGINAL_LANG}" == "en-GB" ] \
  || [ "${ORIGINAL_LANG}" == "it" ] || [ "${ORIGINAL_LANG}" == "ru" ] || exit 1

[ "${ORIGINAL_LANG}" == "en" ] && ORIGINAL_LANG="EN_US"
[ "${ORIGINAL_LANG}" == "en-US" ] && ORIGINAL_LANG="EN_US"
[ "${ORIGINAL_LANG}" == "en-GB" ] && ORIGINAL_LANG="EN_GB"
[ "${ORIGINAL_LANG}" == "ru" ] && ORIGINAL_LANG="RU"
[ "${ORIGINAL_LANG}" == "it" ] && ORIGINAL_LANG="IT"

Q62_ADMIN_AUTH_TOKEN=$(get-auth-token "$ADMIN_USER_POOL_CLI_CLIENT_ID" "$Q62_ADMIN_USERNAME" "$Q62_ADMIN_PASSWORD")

Q62_MOVIE_ID=$(create-movie "$Q62_ADMIN_AUTH_TOKEN" $ORIGINAL_LANG "$ORIGINAL_TITLE" "$RELEASE_YEAR")

cd s3 || exit 1
curl -s "${THEMOVIEDB_IMAGE_BASE}${POSTER_PATH_RU}" --output posterImagePortrait-RU.jpg
curl -s "${THEMOVIEDB_IMAGE_BASE}${POSTER_PATH_EN_US}" --output posterImagePortrait-EN_US.jpg
curl -s "${THEMOVIEDB_IMAGE_BASE}${BACKDROP_PATH}" --output backdropImage.jpg
cd ..

add-poster-image-portrait-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "RU" "${Q62_MOVIE_ID}/posterImagePortrait-RU.jpg"
add-poster-image-portrait-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "EN_US" "${Q62_MOVIE_ID}/posterImagePortrait-EN_US.jpg"
add-backdrop-image-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "${Q62_MOVIE_ID}/backdropImage.jpg"
add-title-localization-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "EN_US" "${TITLE_EN_US}"
add-title-localization-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "RU" "${TITLE_RU}"

aws s3 cp s3/ "s3://${MEDIA_FILES_S3_BUCKET}/${Q62_MOVIE_ID}" --recursive

Q62_ADMIN_AUTH_TOKEN=$(get-auth-token "$ADMIN_USER_POOL_CLI_CLIENT_ID" "$Q62_ADMIN_USERNAME" "$Q62_ADMIN_PASSWORD")
add-mpd-file-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "${Q62_MOVIE_ID}/vod/manifest.mpd"
add-m3u8-file-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "${Q62_MOVIE_ID}/vod/master.m3u8"

for (( i=0; i < NUM_TEXT_STREAMS; ++i )); do
  stream=$(jq ".transcodeSpec.text[$i].stream" $SPEC_FILE)
  forced=$(jq ".transcodeSpec.text[$i].forced" $SPEC_FILE)
  lang_code=$(jq -r ".transcodeSpec.text[$i].langCode" $SPEC_FILE)
  [ "$forced" = "true" ] && file_name="${lang_code}-forced.vtt" || file_name="${lang_code}.vtt"
  [ "$lang_code" = "ru" ] && locale="RU"
  [ "$lang_code" = "en-US" ] && locale="EN_US"
  [ "$forced" = "true" ] && locale="${locale}_FORCED"
  add-subtitle-to-movie "$Q62_ADMIN_AUTH_TOKEN" "$Q62_MOVIE_ID" "${locale}" "${Q62_MOVIE_ID}/subtitles/${file_name}"
done

get-movie "$Q62_MOVIE_ID"

cd ..
rm -r $WORKING_DIR_NAME
