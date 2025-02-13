import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { TvShowRepository } from '../../../adapters/TvShowRepository';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { ReleaseRead } from '../../domain/entity/Release';
import { AudioLang } from '../../domain/AudioLang';
import { Nullable } from '../../../utils';
import { getDefaultReleaseId } from '../getMovieReleases';

const docClient = DynamoDBDocument.from(new DynamoDB({}));
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

interface ReleaseResponse {
  id: string;
  audioLangs: string[];
}

interface EpisodeResponse {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  episodeNumber: number;
  releases: { [key: string]: ReleaseResponse };
  defaultReleaseId: Nullable<string>;
}

interface SeasonResponse {
  originalName: string;
  nameL8ns: { [key: string]: string };
  episodes: EpisodeResponse[];
  seasonNumber: number;
}

interface GetTvShowReleasesResponse {
  seasons: SeasonResponse[];
}

interface GetTvShowReleasesParam {
  id: string
  preferredAudioLang: Nullable<string>
}

interface TvShow {
  id: string
  originalTitle: string;
  titleL8ns: { [key: string]: string };
  seasons: Season[];
}

interface Episode {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  episodeNumber: number;
  releases: { [key: string]: ReleaseRead };
}
  
interface Season {
  originalName: string;
  nameL8ns: { [key: string]: string };
  episodes: Episode[];
  seasonNumber: number;
}

export const handler = async (event: GetTvShowReleasesParam): Promise<GetTvShowReleasesResponse> => {
  const tvShow = (await getTvShow(event.id) as unknown as TvShow);
  const response: GetTvShowReleasesResponse = {
    seasons: []
  }
  let preferredAudioLang = AudioLang.fromKey(event.preferredAudioLang);
  if (preferredAudioLang == null) preferredAudioLang = AudioLang.RU;
  for (const s of tvShow.seasons) {
    const seasonResponse: SeasonResponse = {
      originalName: s.originalName,
      nameL8ns: s.nameL8ns,
      seasonNumber: s.seasonNumber,
      episodes: []
    }
    response.seasons.push(seasonResponse);
    for (const e of s.episodes) {
      const releases = e.releases != null ? e.releases : {};
      if (Object.keys(releases).length === 0) continue;
      const defaultReleaseId = getDefaultReleaseId(e.releases, preferredAudioLang);
      const releaseResponses = Object.entries(releases).reduce((a, c) => {
        a[c[0]] = {
          id: c[0],
          audioLangs: [... new Set(Object.entries(c[1]._audios).map(v => v[1].lang.key))]
        };
        return a;
      }, {});
      const episodeResponse: EpisodeResponse = {
        originalName: e.originalName,
        nameL8ns: e.nameL8ns,
        releases: releaseResponses,
        defaultReleaseId: defaultReleaseId,
        episodeNumber: e.episodeNumber,
        stillImage: e.stillImage
      }
      seasonResponse.episodes.push(episodeResponse);
    }
  }
  return response;
};

async function getTvShow(id: string) {
  return await tvShowRepo.getTvShowById(id);
}
