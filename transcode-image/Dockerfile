FROM jrottenberg/ffmpeg:4.1-alpine

RUN apk add --no-cache bash jq curl aws-cli \
    && curl -Lo /usr/local/bin/shaka-packager https://github.com/google/shaka-packager/releases/download/v2.6.1/packager-linux-x64 \
    && chmod +x /usr/local/bin/shaka-packager \
    && rm -rf /var/cache/apk/*

