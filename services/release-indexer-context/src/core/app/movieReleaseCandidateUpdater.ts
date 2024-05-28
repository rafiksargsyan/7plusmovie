import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepositoryInterface } from '../ports/MovieRepositoryInterface';
import { MovieRepository } from '../../adapters/MovieRepository';
import { handler as updateMovieReleaseCandidates } from './updateMovieReleaseCandidates';

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo: MovieRepositoryInterface = new MovieRepository(docClient);

export const handler = async (): Promise<void> => {
  const movies = await movieRepo.getAllMovies();
  for (const m of movies) {
    m.checkAndEmptyReleaseCandidates(false);
    if (Object.entries(m.releaseCandidates).length !== 0 ) continue;
    if (Object.entries(m.releases).length !== 0) {
      if (new Date().getFullYear() - m.releaseYear > 1) {
        continue; 
      }
      if (Date.now() - m.lastRCScanTime < 24 * 60 * 60 * 1000) {
        continue;
      }
    }
    await updateMovieReleaseCandidates({movieId: m.id});
  }
};
