import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepository } from '../../adapters/MovieRepository';
import { MovieRead } from '../domain/aggregate/Movie';

const docClient = DynamoDBDocument.from(new DynamoDB({}));
const movieRepo = new MovieRepository(docClient);

interface GetMovieParam {
  movieId: string;
}


export const handler = async (event: GetMovieParam) => {
  let movie = await movieRepo.getMovieById(event.movieId) as unknown as MovieRead;
  const releases = {};
  if (!movie._readyToBeProcessed) {
    for (let k in movie._releases) {
      releases[k] = {
        replacedReleaseIds: movie._releases[k].replacedReleaseIds,
        release: {
          id: k,
          torrentFileUrl: movie._releases[k].release._torrentFileUrl,
          mediaFileRelativePath: movie._releases[k].release._mediaFileRelativePath,
          cachedMediaFileRelativePath: movie._releases[k].release._cachedMediaFileRelativePath,
          ripType: movie._releases[k].release._ripType.key,
          resolution: movie._releases[k].release._resolution.key,
          audios: movie._releases[k].release._audios.map(a => ({
            stream: a.stream,
            channels: a.channels,
            bitrate: a.bitrate,
            lang: a.lang.key,
          })),
          subs: movie._releases[k].release._subs.map(s => ({
            stream: s.stream,
            lang: s.lang.key,
            type: s.type?.key,
          }))
        }
      }
    }
  }
  return {
    id: movie._id,
    releases: releases
  };
};
