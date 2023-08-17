import { Marshaller } from '@aws/dynamodb-auto-marshaller';
import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { v2 as cloudinary } from 'cloudinary';
import { S3 } from '@aws-sdk/client-s3';
import { MovieGenre, MovieGenres } from '../domain/MovieGenres';
import { Person, Persons } from '../domain/Persons';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import { Movie } from "../domain/Movie";
import axios from 'axios';
import { L8nLangCode } from '../domain/L8nLangCodes';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

const marshaller = new Marshaller();

const dynamodbMovieTableName = process.env.DYNAMODB_MOVIE_TABLE_NAME!;

const marshallOptions = {
  convertClassInstanceToMap: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const tmdbImageClient = axios.create({
  baseURL: 'https://image.tmdb.org/t/p/original/',
  responseType: 'arraybuffer'
});

const mediaAssetsS3Bucket = process.env.MEDIA_ASSETS_S3_BUCKET!;

interface MovieRead {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  subtitles: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string };
  creationTime: number;
  mpdFile: string;
  m3u8File: string;
  genres: MovieGenre[];
  actors: Person[];
  directors: Person[];
  tmdbId: string | undefined;
  backdropImage: string;
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, secret.ALGOLIA_ADMIN_KEY!);
    const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);
    const tmdbApiKey = secret.TMDB_API_KEY!;
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                        api_key: process.env.CLOUDINARY_API_KEY,
                        api_secret: secret.CLOUDINARY_API_SECRET });
  
    for (const record of event.Records) {
      if (record.eventName === 'REMOVE') {
        let objectID = record.dynamodb?.Keys?.id.S;
        await algoliaIndex.deleteBy({filters: `objectID: ${objectID}`});
        await cloudinary.api.delete_resources_by_prefix(objectID!);
        await emptyS3Directory(mediaAssetsS3Bucket, `${objectID}/`);
      } else {
        let movie: MovieRead = marshaller.unmarshallItem(record.dynamodb?.NewImage!) as unknown as MovieRead;
        let updated: boolean = false;
        if (movie.tmdbId != undefined) {
          updated = await updateBasedOnTmdbId(movie.id, movie.tmdbId, tmdbApiKey, movie);
        } 
        if (updated) {
          return;
        }
        if (movie.mpdFile == null || movie.m3u8File == null
          || Object.keys(movie.posterImagesPortrait).length === 0) {
          return;
        }
        if (movie.genres == undefined) movie.genres = [];
        if (movie.actors == undefined) movie.actors = [];
        if (movie.directors == undefined) movie.directors = [];
        await algoliaIndex.saveObject({ objectID: movie.id,
                                        creationTime: movie.creationTime,
                                        category: "MOVIE",
                                        originalTitle: movie.originalTitle,
                                        posterImagesPortrait: movie.posterImagesPortrait,
                                        titleL8ns: movie.titleL8ns,
                                        releaseYear: movie.releaseYear,
                                        genres: movie.genres.reduce((r, _) => { return { ...r, [_.code] : MovieGenres[_.code] } }, {}),
                                        actors: movie.actors.reduce((r, _) => { return { ...r, [_.code] : Persons[_.code] } }, {}),
                                        directors: movie.directors.reduce((r, _) => { return { ...r, [_.code] : Persons[_.code] } }, {}) });
      }
    }
  } catch (e) {
    console.error(e);
  } 
};

async function emptyS3Directory(bucket, dir) {
  const listParams = {
      Bucket: bucket,
      Prefix: dir
  };

  const listedObjects = await s3.listObjectsV2(listParams);

  if (listedObjects.Contents == undefined ||
    listedObjects.Contents.length === 0) return;

  const deleteParams = {
      Bucket: bucket,
      Delete: { Objects: [] }
  };

  listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key } as never);
  });

  await s3.deleteObjects(deleteParams);

  if (listedObjects.IsTruncated) await emptyS3Directory(bucket, dir);
}

async function updateBasedOnTmdbId(movieId: string, tmdbId: string, tmdbApiKey: string, movieRead: MovieRead) {
  const queryParams = {
    TableName: dynamodbMovieTableName,
    Key: { 'id': movieId }
  } as const;
  let data = await docClient.get(queryParams);
  if (data === undefined || data.Item === undefined) {
    throw new FailedToGetMovieError();
  }
  let movie = new Movie(true);
  Object.assign(movie, data.Item);
  let updated: boolean = false;

  const tmdbMovieEnUs = (await tmdbClient.get(`movie/${tmdbId}?api_key=${tmdbApiKey}&language=en-US`)).data;
  const tmdbMovieRu = (await tmdbClient.get(`movie/${tmdbId}?api_key=${tmdbApiKey}&language=ru`)).data;

  const titleEnUs: string = tmdbMovieEnUs.title;
  const titleRu: string = tmdbMovieRu.title;
  const posterPathEnUs: string = tmdbMovieEnUs.poster_path;
  const posterPathRu: string = tmdbMovieRu.poster_path;
  const backdropPath: string = tmdbMovieEnUs.backdrop_path;

  if (movieRead.titleL8ns['EN_US'] == undefined && titleEnUs != undefined) {
    movie.addTitleL8n(new L8nLangCode('EN_US'), titleEnUs);
    updated = true;
  }
  if (movieRead.titleL8ns['RU'] == undefined && titleRu != undefined) {
    movie.addTitleL8n(new L8nLangCode('RU'), titleRu);
    updated = true;
  } 
  if (movieRead.posterImagesPortrait['EN_US'] == undefined && posterPathEnUs != undefined) {
    const posterImagePortraitEnUs = (await tmdbImageClient.get(posterPathEnUs)).data;
    if (posterImagePortraitEnUs != undefined) {
      const objectKey = `${movieId}/posterImagePortrait-EN_US.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitEnUs,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addPosterImagePortrait(new L8nLangCode('EN_US'), objectKey);
      updated = true;
    }
  }
  if (movieRead.posterImagesPortrait['RU'] == undefined && posterPathRu != undefined) {
    const posterImagePortraitRu = (await tmdbImageClient.get(posterPathRu)).data;
    if (posterImagePortraitRu != undefined) {
      const objectKey = `${movieId}/posterImagePortrait-RU.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitRu,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addPosterImagePortrait(new L8nLangCode('RU'), objectKey);
      updated = true;
    }
  }
  if (movieRead.backdropImage == undefined && backdropPath != undefined) {
    const backdropImage = (await tmdbImageClient.get(backdropPath)).data;
    if (backdropImage != undefined) {
      const objectKey = `${movieId}/backdropImage.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: backdropImage,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      movie.addBackdropImage(objectKey);
      updated = true;
    }
  }
  tmdbMovieEnUs.genres.forEach(_ => {
    let mg: MovieGenre | undefined = tmdbMovieGenreId2MovieGenre[_.id];
    if (mg != undefined && movie.addGenre(mg)) {
      updated = true;
    }
  });

  const tmdbCredits = (await tmdbClient.get(`movie/${tmdbId}/credits?api_key=${tmdbApiKey}`)).data;

  tmdbCredits.cast.forEach(_ => {
    let p: Person | undefined  = tmdbPersonId2Person[_.id];
    if (p != undefined && movie.addActor(p)) {
      updated = true;
    }
  });
 
  tmdbCredits.crew.filter(({job}) => job === 'Director').forEach(_ => {
    let p: Person | undefined  = tmdbPersonId2Person[_.id];
    if (p != undefined && movie.addDirector(p)) {
      updated = true;
    }
  });

  if (updated) {
    await docClient.put({ TableName: dynamodbMovieTableName, Item: movie });
  }
  return updated;
}

const tmdbMovieGenreId2MovieGenre = {
  "28" : new MovieGenre('ACTION'),
  "12" : new MovieGenre('ADVENTURE'),
  "16" : new MovieGenre("ANIMATION"),
  "35" : new MovieGenre('COMEDY'),
  "80" : new MovieGenre('CRIME'),
  "99" : new MovieGenre('DOCUMENTARY'),
  "18" : new MovieGenre('DRAMA'),
  "10751" : new MovieGenre('FAMILY'),
  "14" : new MovieGenre('FANTASY'),
  "36" : new MovieGenre("HISTORY"),
  "27" : new MovieGenre('HORROR'),
  "10402" : new MovieGenre('MUSIC'),
  "9648" : new MovieGenre('MYSTERY'),
  "10749" : new MovieGenre('ROMANCE'),
  "878" : new MovieGenre('SCI_FI'),
  "53" : new MovieGenre('THRILLER'),
  "10752" : new MovieGenre('WAR'),
  "37" : new MovieGenre('WESTERN')
} as const;

const tmdbPersonId2Person = {
  "116" : new Person("KEIRA_KNIGHTLEY"),
  "131" : new Person("JAKE_GYLLENHAAL"),
  "956" : new Person("GUY_RITCHIE"),
  "525" : new Person("CHRISTOPHER_NOLAN"),
  "10297" : new Person("MATTHEW_MCCONAUGHEY"),
  "2710" : new Person("JAMES_CAMERON"),
  "1100" : new Person("ARNOLD_SCHWARZENEGGER"),
  "3894" : new Person("CHRISTIAN_BALE"),
  "65731" : new Person("SAM_WORTHINGTON"),
  "1223786" : new Person("EMILIA_CLARKE"),
  "1813" : new Person("ANNE_HATHAWAY"),
  "1892" : new Person("MATT_DAMON"),
  "1893" : new Person("CASEY_AFFLECK"),
  "6193" : new Person("LEONARDO_DICAPRIO"),
  "24045" : new Person("JOSEPH_GORDON_LEVITT"),
  "2037" : new Person("CILLIAN_MURPHY"),
  "2524" : new Person("TOM_HARDY"),
  "8293" : new Person("MARION_COTILLARD"),
  "1810" : new Person("HEATH_LEDGER"),
  "64" : new Person("GARY_OLDMAN"),
  "192" : new Person("MORGAN_FREEMAN"),
  "6968" : new Person("HUGH_JACKMAN"),
  "1245" : new Person("SCARLETT_JOHANSSON"),
  "15555" : new Person("PIPER_PERABO"),
  "514" : new Person("JACK_NICHOLSON"),
  "1032" : new Person("MARTIN_SCORSESE"),
  "114" : new Person("ORLANDO_BLOOM"),
  "112" : new Person("CATE_BLANCHETT"),
  "48" : new Person("SEAN_BEAN"),
  "3490" : new Person("ADRIEN_BRODY"),
  "578" : new Person("RIDLEY_SCOTT"),
  "934" : new Person("RUSSELL_CROWE"),
  "73421" : new Person("JOAQUIN_PHOENIX"),
  "31" : new Person("TOM_HANKS"),
  "4027" : new Person("FRANK_DARABONT"),
  "7467" : new Person("DAVID_FINCHER"),
  "819" : new Person("EDWARD_NORTON"),
  "287" : new Person("BRAD_PITT"),
  "7499" : new Person("JARED_LETO"),
  "488" : new Person("STEVEN_SPIELBERG"),
  "12835" : new Person("VIN_DIESEL"),
  "1979" : new Person("KEVIN_SPACEY"),
  "138" : new Person("QUENTIN_TARANTINO"),
  "8891" : new Person("JOHN_TRAVOLTA"),
  "2231" : new Person("SAMUEL_L_JACKSON"),
  "139" : new Person("UMA_THURMAN"),
  "62" : new Person("BRUCE_WILLIS"),
  "3896" : new Person("LIAM_NEESON"),
  "4173" : new Person("ANTHONY_HOPKINS"),
  "380" : new Person("ROBERT_DE_NIRO"),
  "1158" : new Person("AL_CAPINO"),
  "190" : new Person("CLINT_EASTWOOD"),
  "13240" : new Person("MARK_WAHLBERG"),
  "28782" : new Person("MONICA_BELLUCCI"),
  "6384" : new Person("KEANU_REEVES")
} as const;


class FailedToGetMovieError extends Error {}
