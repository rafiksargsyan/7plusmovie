FROM jrottenberg/ffmpeg:4.1-ubuntu

ADD ./inspect-streams.sh /usr/local/bin/inspect-streams
RUN chmod +x /usr/local/bin/inspect-streams

ADD ./normalize-episode-names.sh /usr/local/bin/normalize-episode-names
RUN chmod +x /usr/local/bin/normalize-episode-names

RUN apt-get update && \
    apt-get install -y --no-install-recommends apt-utils && \
    DEBIAN_FRONTEND=noninteractive apt-get -y install jq && \
    rm -rf /var/cache/apt/archives /var/lib/apt/lists/*

ENTRYPOINT ["tail", "-f", "/dev/null"]
