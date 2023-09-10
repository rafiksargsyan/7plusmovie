FROM alpine:3.18.3

RUN apk --update add --no-cache bash jq curl aws-cli imagemagick \
    && wget https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
    && tar xvf ffmpeg-release-amd64-static.tar.xz \
    && mv ffmpeg-6.0-amd64-static/ffmpeg ffmpeg-6.0-amd64-static/ffprobe /usr/local/bin/ \
    && curl -Lo /usr/local/bin/shaka-packager https://github.com/google/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
    && chmod +x /usr/local/bin/shaka-packager \
    && rm -rf /var/cache/apk/*
