import axios from "axios";
import { NextResponse } from "next/server";
import { createClient } from "redis";

const cfBandwidthToStorageFactor = 100;

function dayOfMonth() {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const daysPassed = Math.floor((today.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysPassed;
}

export async function GET() {
  const redis = createClient({ url: process.env.REDIS_URL });
  const today = new Date();
  try {
    await redis.connect();

    const monthToDateUsageQuery = {
        query: `
          query {
             viewer {
               zones(filter: { zoneTag: "${process.env.CLOUDFLARE_ZONE_ID}" }) {
                 httpRequests1dGroups(limit: 30, filter: {date_geq: "${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}", date_lt: "${today.toISOString().split('T')[0]}"}) {
                   sum {
                     bytes
                   }
                 }
              }
          }
        }`,
      };
    let response = await axios.post(`https://api.cloudflare.com/client/v4/graphql`,
        monthToDateUsageQuery,
      {
        headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN}` },
      }
    );
    const monthToDateBytes = response.data.data.viewer.zones[0].httpRequests1dGroups[0].sum.bytes;

    response = await axios.get(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${process.env.CLOUDFLARE_MEDIA_ASSETS_BUCKET_NAME}/usage`,
        {
            headers: { 'Authorization': `Bearer ${process.env.CLOUDFLARE_ANALYTICS_READ_TOKEN}` },
        }
    );
    const mediaAssetsBucketSize = response.data.result.payloadSize;
    

    const maxVideoQualityStr = await redis.get('maxVideoQuality');
    let maxVideoQuality = maxVideoQualityStr != null ? Number.parseInt(maxVideoQualityStr) : Number.NaN;
    if (Number.isNaN(maxVideoQuality)) {
      maxVideoQuality = 1080;  
    }

    const videoQualityBreakpoints = [360, 480, 720, 1080];
    const i = videoQualityBreakpoints.indexOf(maxVideoQuality);
    if (mediaAssetsBucketSize * cfBandwidthToStorageFactor / 30 * dayOfMonth() < monthToDateBytes) {
      if (i != 0) {
        await redis.set('maxVideoQuality', videoQualityBreakpoints[i-1]);
      }
    } else {
      if (i != videoQualityBreakpoints.length - 1) {
        await redis.set('maxVideoQuality', videoQualityBreakpoints[i+1]);
      }
    }

    await redis.disconnect();
    return NextResponse.json({ message: "Bandwidth updated successfully" });
  } catch (error) {
    console.error("Error updating bandwidth:", error);
    await redis.disconnect();
    return NextResponse.json({ error: "Failed to update bandwidth" }, { status: 500 });
  }
}
