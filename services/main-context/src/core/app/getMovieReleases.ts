import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { ReleaseRead } from '../domain/entity/Release';
import { AudioLang } from '../domain/AudioLang';
import { Nullable } from '../../utils';
import { RipType } from '../domain/RipType';
import { Resolution } from '../domain/Resolution';

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const docClient = DynamoDBDocument.from(new DynamoDB({}));  

interface ReleaseResponse {
  id: string;
  ripType: Nullable<string>;
  resolution: string;
  audioLangs: string[];
}

interface GetMovieReleasesResponse {
  releases: { [id:string] : ReleaseResponse };
  defaultReleaseId: Nullable<string>;
}

interface Movie {
  releases: { [key: string]: ReleaseRead };
}

interface GetMovieReleasesParam {
  movieId: string
  preferredAudioLang: Nullable<string>
}

export const handler = async (event: GetMovieReleasesParam): Promise<GetMovieReleasesResponse> => {
  let movie = await getMovie(event.movieId);
  let releases = movie.releases;
  if (releases == null) releases = {};
  let preferredAudioLang = AudioLang.fromKey(event.preferredAudioLang)
  if (preferredAudioLang == null) preferredAudioLang = AudioLang.RU
  const defaultReleaseId = getDefaultReleaseId(releases, preferredAudioLang);
  const retReleases = Object.entries(releases).reduce((a, c) => {
    a[c[0]] = {
      id: c[0],
      ripType: c[1]._ripType?.key,
      resolution: c[1]._resolution != null ? c[1]._resolution.key : Resolution.FHD.key,
      audioLangs: [... new Set(Object.entries(c[1]._audios).map(v => v[1].lang.key))]
    };
    return a;
  }, {});
  return {
    releases: retReleases,
    defaultReleaseId: defaultReleaseId
  };
};

class FailedToGetMovieError extends Error {}

async function getMovie(id: string) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': id }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie: Movie = data.Item as unknown as Movie;
  return movie;
}

export function getDefaultReleaseId(releases: { [key:string]: ReleaseRead }, preferredAudioLang: AudioLang) {
  if (Object.keys(releases).length === 0) {
    return null;
  }

  // find releases with matching audio language and sort based on quality
  let candidates = Object.entries(releases).filter(r => {
    for (const a of Object.values(r[1]._audios)) {
      if (AudioLang.equals(a.lang, preferredAudioLang)) return true
    }
    return false
  })
  if (candidates.length !== 0) {
    candidates.sort((a, b) => {
      const resCompareResult = Resolution.compare(b[1]._resolution, a[1]._resolution)
      if (resCompareResult === 0) {
        return RipType.compare(b[1]._ripType, a[1]._ripType)
      }
      return resCompareResult
    })
    return candidates[0][0]
  }
  
  // find releases with loose matching audio language and sort based on quality
  candidates = Object.entries(releases).filter(r => {
    for (const a of Object.values(r[1]._audios)) {
      if (AudioLang.looseEquals(a.lang, preferredAudioLang)) return true
    }
    return false
  })
  if (candidates.length !== 0) {
    candidates.sort((a, b) => {
      const ripCompareResult = RipType.compare(b[1]._ripType, a[1]._ripType)
      if (ripCompareResult === 0) {
        return Resolution.compare(b[1]._resolution, a[1]._resolution)
      }
      return ripCompareResult
    })
    return candidates[0][0]
  }
  
  const entries = Object.entries(releases);
  // just sort by quality
  entries.sort((a, b) => {
    const ripCompareResult = RipType.compare(b[1]._ripType, a[1]._ripType)
    if (ripCompareResult === 0) {
      return Resolution.compare(b[1]._resolution, a[1]._resolution)
    }
    return ripCompareResult
  })

  return entries[0][0];
}
