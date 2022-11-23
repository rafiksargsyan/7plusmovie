import {v4 as uuid} from 'uuid';

export class Movie {
    id: string;
    originalLocale: string;
    originalTitle: string;
    webUIGridViewPosterImageCloudfrontURL: string;
    subtitles: { [key: string]: string };
    mpdFileCloudfrontURL: string;

    constructor(originalLocale: string, originalTitle: string, posterURL: string,
        subtitles : { [key: string]: string }, mpdFileURL: string) {
        
        this.id = uuid();
        this.originalLocale = originalLocale;
        this.originalTitle = originalTitle;
        this.webUIGridViewPosterImageCloudfrontURL = posterURL;
        this.subtitles = subtitles;
        this.mpdFileCloudfrontURL = mpdFileURL;
    }
}