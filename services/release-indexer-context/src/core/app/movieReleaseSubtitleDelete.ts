import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { MovieRepository } from "../../adapters/MovieRepository";

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const movieRepo = new MovieRepository(docClient);

interface Param {
  movieId: string;
  releaseId: string;
  stream: number;
}

export const handler = async (event: Param): Promise<void> => {
  const movie = await movieRepo.getMovieById(event.movieId);
  movie.deleteSub(event.releaseId, event.stream);
  await movieRepo.saveMovie(movie);
};
