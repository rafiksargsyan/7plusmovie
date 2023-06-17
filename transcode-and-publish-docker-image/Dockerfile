FROM jrottenberg/ffmpeg:4.1-alpine

RUN apk add --no-cache bash jq curl aws-cli \
    && curl -Lo /usr/local/bin/shaka-packager https://github.com/google/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
    && chmod +x /usr/local/bin/shaka-packager \
    && rm -rf /var/cache/apk/*

COPY add-backdrop-image-to-movie.sh /usr/local/bin/add-backdrop-image-to-movie
RUN chmod +x /usr/local/bin/add-backdrop-image-to-movie

COPY add-mpd-file-to-movie.sh /usr/local/bin/add-mpd-file-to-movie
RUN chmod +x /usr/local/bin/add-mpd-file-to-movie

COPY add-subtitle-to-movie.sh /usr/local/bin/add-subtitle-to-movie
RUN chmod +x /usr/local/bin/add-subtitle-to-movie

COPY create-movie.sh /usr/local/bin/create-movie
RUN chmod +x /usr/local/bin/create-movie

COPY get-auth-token.sh /usr/local/bin/get-auth-token
RUN chmod +x /usr/local/bin/get-auth-token

COPY transcode-and-publish-movie.sh /usr/local/bin/transcode-and-publish-movie
RUN chmod +x /usr/local/bin/transcode-and-publish-movie

COPY transcode-subs-from-mkv.sh /usr/local/bin/transcode-subs-from-mkv
RUN chmod +x /usr/local/bin/transcode-subs-from-mkv

COPY add-m3u8-file-to-movie.sh /usr/local/bin/add-m3u8-file-to-movie
RUN chmod +x /usr/local/bin/add-m3u8-file-to-movie

COPY add-poster-image-portrait-to-movie.sh /usr/local/bin/add-poster-image-portrait-to-movie
RUN chmod +x /usr/local/bin/add-poster-image-portrait-to-movie

COPY add-title-localization-to-movie.sh /usr/local/bin/add-title-localization-to-movie
RUN chmod +x /usr/local/bin/add-title-localization-to-movie

COPY get-movie.sh /usr/local/bin/get-movie
RUN chmod +x /usr/local/bin/get-movie

COPY transcode-audio-from-mkv.sh /usr/local/bin/transcode-audio-from-mkv
RUN chmod +x /usr/local/bin/transcode-audio-from-mkv

COPY transcode-video-from-mkv.sh /usr/local/bin/transcode-video-from-mkv
RUN chmod +x /usr/local/bin/transcode-video-from-mkv
