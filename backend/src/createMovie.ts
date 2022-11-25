import { Movie } from "./Movie";
import { DynamoDB } from 'aws-sdk';

const docClient = new DynamoDB.DocumentClient();

interface CreateMovieParam {
    originalLocale: string;
    originalTitle: string;
    webUIGridViewPosterImageCloudfrontURL: string;
    subtitles: { [key: string]: string };
    mpdFileCloudfrontURL: string;
}

export const handler = async (event: CreateMovieParam): Promise<string> => {
  throw new MyError("MY error");
  let movie = new Movie(event.originalLocale, event.originalTitle, event.webUIGridViewPosterImageCloudfrontURL,
    event.subtitles, event.mpdFileCloudfrontURL);
  console.log(movie); 
  await docClient.put({ TableName: 'movies', Item: movie }).promise();

  return movie.id;
};

class MyError extends Error {
  foo: string;

  constructor(foo: string) {
    super();
    this.foo = foo;
  }
}
