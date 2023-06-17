ARG ALPINE_VERSION=3.17
FROM python:3.10-alpine${ALPINE_VERSION} as builder

ARG AWS_CLI_VERSION=2.12.1
RUN apk add --no-cache git unzip groff build-base libffi-dev cmake
RUN git clone --single-branch --depth 1 -b ${AWS_CLI_VERSION} https://github.com/aws/aws-cli.git

WORKDIR aws-cli
RUN ./configure --with-install-type=portable-exe --with-download-deps
RUN make
RUN make install

# reduce image size: remove autocomplete and examples
RUN rm -rf \
    /usr/local/lib/aws-cli/aws_completer \
    /usr/local/lib/aws-cli/awscli/data/ac.index \
    /usr/local/lib/aws-cli/awscli/examples
RUN find /usr/local/lib/aws-cli/awscli/data -name completions-1*.json -delete
RUN find /usr/local/lib/aws-cli/awscli/botocore/data -name examples-1.json -delete
RUN (cd /usr/local/lib/aws-cli; for a in *.so*; do test -f /lib/$a && rm $a; done)

FROM jrottenberg/ffmpeg:4.1-alpine

RUN apk add --no-cache bash jq curl \
    && curl -Lo /usr/local/bin/shaka-packager https://github.com/google/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
    && chmod +x /usr/local/bin/shaka-packager \
    && rm -rf /var/cache/apk/*

COPY --from=builder /usr/local/lib/aws-cli/ /usr/local/lib/aws-cli/
RUN ln -s /usr/local/lib/aws-cli/aws /usr/local/bin/aws

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
