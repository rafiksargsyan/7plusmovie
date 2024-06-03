import { Nullable } from "../../../Nullable";
import { AudioAuthor } from "./AudioAuthor";
import { AudioLang } from "./AudioLang";
import { AudioVoiceType } from "./AudioVoiceType";

export class AudioMetadata {
  public readonly stream: number;
  public readonly channels: number;
  public readonly bitrate: number; // bits/second
  public readonly lang: AudioLang;
  public readonly voiceType: Nullable<AudioVoiceType>;
  public readonly author: Nullable<AudioAuthor>;

  public constructor(stream: Nullable<number>, channels: number, bitrate: number,
    lang: AudioLang, voiceType: Nullable<AudioVoiceType>, author: Nullable<AudioAuthor>) {
    this.stream = this.validateStream(stream);
    this.channels = this.validateChannels(channels);
    this.bitrate = this.validateBitrate(bitrate);
    this.lang = this.validateLang(lang);
    this.voiceType = voiceType;
    this.author = author;
  }

  private validateStream(stream: Nullable<number>) {
    if (stream == null) throw new NullAudioStreamError();
    return stream;
  }

  private validateChannels(channels: Nullable<number>) {
    if (channels == null) throw new NullAudioChannelsError();
    return channels;
  }

  private validateBitrate(bitrate: Nullable<number>) {
    if (bitrate == null) throw new NullAudioBitrateError();
    return bitrate;
  }

  private validateLang(lang: Nullable<AudioLang>) {
    if (lang == null) throw new NullAudioLangError();
    return lang;
  }
}

export class NullAudioStreamError extends Error {};

export class NullAudioChannelsError extends Error {};

export class NullAudioBitrateError extends Error {};

export class NullAudioLangError extends Error {};
