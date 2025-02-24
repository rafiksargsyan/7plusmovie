import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";

async function getQualityLimit() {
  const redis = createClient({ url: process.env.REDIS_URL, socket: {
    reconnectStrategy: () => Error("Don't retry")
  } });
  const maxVideoQualityStr = await redis.get('maxVideoQuality');
  let maxVideoQuality = maxVideoQualityStr != null ? Number.parseInt(maxVideoQualityStr) : Number.NaN;
  if (Number.isNaN(maxVideoQuality)) {
    maxVideoQuality = 1080;  
  }
  await redis.disconnect();
  return maxVideoQuality;
}

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url);
  const m3u8RelativePath = searchParams.get("m3u8RelativePath");
  const m3u8Url = `${process.env.MEDIA_ASSETS_BASE_URL}/${m3u8RelativePath}`;
  const response = await axios.get(m3u8Url);
  const playlist = response.data.split("\n");
  let qualityLimit;
  try {
    qualityLimit = await getQualityLimit();
  } catch {
    qualityLimit = 1080;
  }

  const filteredPlaylist = [];
  let skipNextLine = false;

  for (let i = 0; i < playlist.length; i++) {
    if (skipNextLine) {
      skipNextLine = false;
      continue;
    }

    if (playlist[i].startsWith("#EXT-X-STREAM-INF")) {
      const resolutionMatch = playlist[i].match(/RESOLUTION=(\d+)x(\d+)/);
      if (resolutionMatch) {
        const height = parseInt(resolutionMatch[2], 10);
        if (height > qualityLimit) {
          skipNextLine = true;
          continue;
        }
      }
    }

    if (qualityLimit < 720) {
      if (playlist[i].startsWith("#EXT-X-MEDIA") && playlist[i].includes('TYPE=AUDIO')) {
        const channelsMatch = playlist[i].match(/CHANNELS="?(\d+)"?/);
  
        if (channelsMatch) {
          const channels = parseInt(channelsMatch[1], 10);
  
          if (channels >= 6) {
            skipNextLine = true;
            continue;
          }
        }
      }
    }

    filteredPlaylist.push(playlist[i]);
  }

  return new NextResponse(filteredPlaylist.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
    },
  });
}
