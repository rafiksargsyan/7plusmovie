import { DynamoDBStreamEvent } from 'aws-lambda';
import algoliasearch from 'algoliasearch';
import { SecretsManager } from '@aws-sdk/client-secrets-manager';
import { S3 } from '@aws-sdk/client-s3';
import { TvShowGenre, TvShowGenres } from '../../domain/TvShowGenres';
import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import { L8nLangCode } from '../../domain/L8nLangCodes';
import { TvShowRepositoryInterface } from '../../ports/TvShowRepositoryInterface';
import { TvShowRepository } from '../../../adapters/TvShowRepository';
import { strIsBlank } from '../../../utils';

const secretManagerSecretId = process.env.SECRET_MANAGER_SECRETS_ID!;

const secretsManager = new SecretsManager({});
const s3 = new S3({});

const marshallOptions = {
  convertClassInstanceToMap: true,
  removeUndefinedValues: true
};

const translateConfig = { marshallOptions };

const docClient = DynamoDBDocument.from(new DynamoDB({}), translateConfig);
const tvShowRepo: TvShowRepositoryInterface = new TvShowRepository(docClient);

const tmdbClient = axios.create({
  baseURL: 'https://api.themoviedb.org/3/',
});

const tmdbImageClient = axios.create({
  baseURL: 'https://image.tmdb.org/t/p/original/',
  responseType: 'arraybuffer'
});

const mediaAssetsS3Bucket = process.env.MEDIA_ASSETS_S3_BUCKET!;

export interface Episode {
  originalName: string;
  nameL8ns: { [key: string]: string };
  stillImage: string;
  mpdFile: string;
  m3u8File: string;
  tmdbEpisodeNumber: number;
  episodeNumber;
  releases: { [key: string]: any }
}
    
export interface Season {
  originalName: string;
  nameL8ns: { [key: string]: string };
  episodes: Episode[];
  tmdbSeasonNumber: number;
  posterImagesPortrait: { [key: string]: string };
  seasonNumber;
}

export interface TvShowRead {
  id: string;
  originalTitle: string;
  posterImagesPortrait: { [key: string]: string };
  releaseYear: number;
  titleL8ns: { [key: string]: string };
  creationTime: number;
  mpdFile: string;
  m3u8File: string;
  genres: TvShowGenre[];
  tmdbId: string | undefined;
  backdropImage: string;
  seasons: Season[];
}

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  try {
    const secretStr = await secretsManager.getSecretValue({ SecretId: secretManagerSecretId});
    const secret = JSON.parse(secretStr.SecretString!);
    const algoliaClient = algoliasearch(process.env.ALGOLIA_APP_ID!, secret.ALGOLIA_ADMIN_KEY!);
    const algoliaIndex = algoliaClient.initIndex(process.env.ALGOLIA_ALL_INDEX!);
    const tmdbApiKey = secret.TMDB_API_KEY!;
  
    for (const record of event.Records) {
      let SK = record.dynamodb?.Keys?.SK.S;
      if (SK !== 'tvshow') {
        continue;
      }
      if (record.eventName === 'REMOVE') {
        let PK = record.dynamodb?.Keys?.PK.S;
        if (PK == undefined || ! /\S/.test(PK)) {
          throw new EmptyObjectIdError();
        }
        await algoliaIndex.deleteBy({filters: `objectID: ${PK}`});
        await emptyS3Directory(mediaAssetsS3Bucket, `${PK}/`);
      } else {
        let tvShow: TvShowRead = (await tvShowRepo.getTvShowById(record.dynamodb?.Keys?.PK.S)) as unknown as TvShowRead;
        let updated: boolean = false;
        if (tvShow.tmdbId != undefined) {
          updated = await updateBasedOnTmdbId(tvShow.id, tvShow.tmdbId, tmdbApiKey, tvShow);
        } 
        if (updated) {
          return;
        }
        if (Object.keys(tvShow.posterImagesPortrait).length == 0) {
          return;
        }
        let releaseExists = false;
        for (const s of tvShow.seasons) {
          for (const e of s.episodes) {
            if (e.releases != null && Object.keys(e.releases).length !== 0) {
              releaseExists = true
              break
            }
          }
          if (releaseExists) break
        }
        if (!releaseExists) {
          return
        }
        if (tvShow.genres == undefined) tvShow.genres = [];
        await algoliaIndex.saveObject({ objectID: tvShow.id,
                                        creationTime: tvShow.creationTime,
                                        category: "TV_SHOW",
                                        originalTitle: tvShow.originalTitle,
                                        posterImagesPortrait: tvShow.posterImagesPortrait,
                                        titleL8ns: tvShow.titleL8ns,
                                        releaseYear: tvShow.releaseYear,
                                        genres: tvShow.genres.reduce((r, _) => { return { ...r, [_.code] : TvShowGenres[_.code] } }, {})});
      }
    }
  } catch (e) {
    console.error(e);
  } 
};

async function emptyS3Directory(bucket, dir: string) {
  if (strIsBlank(dir)) return;
  if (!dir.endsWith('/')) dir = `${dir}/`

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

async function updateBasedOnTmdbId(tvShowId: string, tmdbId: string, tmdbApiKey: string, tvShowRead: TvShowRead) {
  let tvShow = await tvShowRepo.getTvShowById(tvShowId);
  let updated: boolean = false;

  const tmdbTvShowEnUs = (await tmdbClient.get(`tv/${tmdbId}?api_key=${tmdbApiKey}&language=en-US`)).data;
  const tmdbTvShowRu = (await tmdbClient.get(`tv/${tmdbId}?api_key=${tmdbApiKey}&language=ru`)).data;

  const titleEnUs: string = tmdbTvShowEnUs.name;
  const titleRu: string = tmdbTvShowRu.name;
  const posterPathEnUs: string = tmdbTvShowEnUs.poster_path;
  const posterPathRu: string = tmdbTvShowRu.poster_path;
  const backdropPath: string = tmdbTvShowEnUs.backdrop_path;

  if (tvShowRead.titleL8ns['EN_US'] == undefined && titleEnUs != undefined) {
    tvShow.addTitleL8n(new L8nLangCode('EN_US'), titleEnUs);
    updated = true;
  }
  if (tvShowRead.titleL8ns['RU'] == undefined && titleRu != undefined) {
    tvShow.addTitleL8n(new L8nLangCode('RU'), titleRu);
    updated = true;
  } 

  if (tvShowRead.posterImagesPortrait['EN_US'] == undefined && posterPathEnUs != undefined) {
    const posterImagePortraitEnUs = (await tmdbImageClient.get(posterPathEnUs)).data;
    if (posterImagePortraitEnUs != undefined) {
      const objectKey = `${tvShowId}/posterImagePortrait-EN_US.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitEnUs,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      tvShow.addPosterImagePortrait(new L8nLangCode('EN_US'), objectKey);
      updated = true;
    }
  }
  if (tvShowRead.posterImagesPortrait['RU'] == undefined && posterPathRu != undefined) {
    const posterImagePortraitRu = (await tmdbImageClient.get(posterPathRu)).data;
    if (posterImagePortraitRu != undefined) {
      const objectKey = `${tvShowId}/posterImagePortrait-RU.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: posterImagePortraitRu,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      tvShow.addPosterImagePortrait(new L8nLangCode('RU'), objectKey);
      updated = true;
    }
  }
  if (tvShowRead.backdropImage == undefined && backdropPath != undefined) {
    const backdropImage = (await tmdbImageClient.get(backdropPath)).data;
    if (backdropImage != undefined) {
      const objectKey = `${tvShowId}/backdropImage.jpg`;
      const s3Params = {
        Bucket: mediaAssetsS3Bucket,
        Key: objectKey,
        Body: backdropImage,
        ContentType: 'image/jpg'
      };
      await s3.putObject(s3Params);
      tvShow.addBackdropImage(objectKey);
      updated = true;
    }
  }

  tmdbTvShowEnUs.genres.forEach(_ => {
    let mg: TvShowGenre | undefined = tmdbTvShowGenreId2TvShowGenre[_.id];
    if (mg != undefined && tvShow.addGenre(mg)) {
      updated = true;
    }
  });

  for (let _ of tvShowRead.seasons) {
    if (_.tmdbSeasonNumber != undefined) {
      const tmdbSeasonEnUs = (await tmdbClient.get(`tv/${tmdbId}/season/${_.tmdbSeasonNumber}?api_key=${tmdbApiKey}&language=en-US`)).data;
      const tmdbSeasonRu = (await tmdbClient.get(`tv/${tmdbId}/season/${_.tmdbSeasonNumber}?api_key=${tmdbApiKey}&language=ru`)).data;

      const seasonNameEnUs: string = tmdbSeasonEnUs.name;
      const seasonNameRu: string = tmdbSeasonRu.name;
      const seasonPosterPathEnUs: string = tmdbSeasonEnUs.poster_path;
      const seasonPosterPathRu: string = tmdbSeasonRu.poster_path;
       
      if (_.nameL8ns['EN_US'] == undefined && seasonNameEnUs != undefined) {
        tvShow.addSeasonNameL8n(_.seasonNumber, new L8nLangCode('EN_US'), seasonNameEnUs);
        updated = true;
      }
      if (_.nameL8ns['RU'] == undefined && seasonNameRu != undefined) {
        tvShow.addSeasonNameL8n(_.seasonNumber, new L8nLangCode('RU'), seasonNameRu);
        updated = true;
      }

      if (_.posterImagesPortrait['EN_US'] == undefined && seasonPosterPathEnUs != undefined) {
        const posterImagePortraitEnUs = (await tmdbImageClient.get(seasonPosterPathEnUs)).data;
        if (posterImagePortraitEnUs != undefined) {
          const objectKey = `${tvShowId}/${_.seasonNumber}/posterImagePortrait-EN_US.jpg`;
          const s3Params = {
            Bucket: mediaAssetsS3Bucket,
            Key: objectKey,
            Body: posterImagePortraitEnUs,
            ContentType: 'image/jpg'
          };
          await s3.putObject(s3Params);
          tvShow.addPosterImagePortraitToSeason(_.seasonNumber, new L8nLangCode('EN_US'), objectKey);
          updated = true;
        }
      }
      if (_.posterImagesPortrait['RU'] == undefined && seasonPosterPathRu != undefined) {
        const posterImagePortraitRu = (await tmdbImageClient.get(seasonPosterPathRu)).data;
        if (posterImagePortraitRu != undefined) {
          const objectKey = `${tvShowId}/${_.seasonNumber}/posterImagePortrait-RU.jpg`;
          const s3Params = {
            Bucket: mediaAssetsS3Bucket,
            Key: objectKey,
            Body: posterImagePortraitRu,
            ContentType: 'image/jpg'
          };
          await s3.putObject(s3Params);
          tvShow.addPosterImagePortraitToSeason(_.seasonNumber, new L8nLangCode('RU'), objectKey);
          updated = true;
        }
      }
      const tmdbEpisodeNumber2TmdbEpisodeEnUs = tmdbSeasonEnUs.episodes.reduce((acc, cur) => {
        acc[cur.episode_number] = cur;
        return acc;
      }, [])
      const tmdbEpisodeNumber2TmdbEpisodeRu = tmdbSeasonRu.episodes.reduce((acc, cur) => {
        acc[cur.episode_number] = cur;
        return acc;
      }, [])

      for (let episode of _.episodes) {
        if (episode.tmdbEpisodeNumber != undefined) {
          const tmdbEpisodeEnUs = tmdbEpisodeNumber2TmdbEpisodeEnUs[episode.tmdbEpisodeNumber];
          const tmdbEpisodeRu = tmdbEpisodeNumber2TmdbEpisodeRu[episode.tmdbEpisodeNumber];
          if (episode.nameL8ns['EN_US'] == undefined && tmdbEpisodeEnUs.name != undefined) {
            tvShow.addEpisodeNameL8n(_.seasonNumber, episode.episodeNumber, new L8nLangCode('EN_US'), tmdbEpisodeEnUs.name);
            updated = true;
          }
          if (episode.nameL8ns['RU'] == undefined && tmdbEpisodeRu.name != undefined) {
            tvShow.addEpisodeNameL8n(_.seasonNumber, episode.episodeNumber, new L8nLangCode('RU'), tmdbEpisodeRu.name);
            updated = true;
          }
          if (episode.stillImage == undefined && tmdbEpisodeEnUs.still_path != undefined) {
            const stillImage = (await tmdbImageClient.get(tmdbEpisodeEnUs.still_path)).data;
            if (stillImage != undefined) {
              const objectKey = `${tvShowId}/${_.seasonNumber}/${episode.episodeNumber}/stillImage.jpg`;
              const s3Params = {
                Bucket: mediaAssetsS3Bucket,
                Key: objectKey,
                Body: stillImage,
                ContentType: 'image/jpg'
              };
              await s3.putObject(s3Params);
              tvShow.addStillImage(_.seasonNumber, episode.episodeNumber, objectKey);
              updated = true;
            }
          }
        }
      }
    }
  }

  if (updated) {
    await tvShowRepo.saveTvShow(tvShow);
  }

  return updated;
}

const tmdbTvShowGenreId2TvShowGenre = {
  "10759" : new TvShowGenre('ACTION'),
  "16" : new TvShowGenre("ANIMATION"),
  "35" : new TvShowGenre('COMEDY'),
  "80" : new TvShowGenre('CRIME'),
  "99" : new TvShowGenre('DOCUMENTARY'),
  "18" : new TvShowGenre('DRAMA'),
  "10751" : new TvShowGenre('FAMILY'),
  "9648" : new TvShowGenre('MYSTERY'),
  "10765" : new TvShowGenre('SCI_FI'),
  "37" : new TvShowGenre('WESTERN'),
  "10768" : new TvShowGenre('WAR')
} as const;

class EmptyObjectIdError extends Error {}
