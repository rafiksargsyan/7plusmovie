import { AudioTrack, MediaPlayer, MediaProvider, PlayerSrc, Poster, useMediaStore } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { useEffect, useRef, useState } from 'react';
import { Nullable } from '@/types/Nullable';
import { parseResponse } from 'media-captions';
import { Subtitle } from '@/app/[locale]/movie/movie-page';
import { VTTCue } from 'media-captions';
import OpenAI from 'openai';
import { Modal, Stack, Text } from '@mantine/core';

const openaiClient = new OpenAI({
    apiKey: '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',
    dangerouslyAllowBrowser: true  
});

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

const getLastWithContext = (time: number, cues: Nullable<VTTCue[]>,
    contextStartInterval: number, startInterval: number, contextEndInterval: number): Nullable<[string, string]> => {
  if (cues == null) return null;      
  let contextStartIndex: number = 0;
  let contextEndIndex: number = -1;
  let startIndex: number = 0;
  let endIndex: number = -1;
  const contextStartTime = Math.max(0, time - contextStartInterval);
  const contextEndTime = Math.min(time + contextEndInterval, cues[cues.length - 1].endTime);
  const startTime = Math.max(0, time - startInterval);
  const endTime = time;
  if (startTime > cues[cues.length - 1].endTime || endTime < cues[0].startTime) return null;
  let prevEndTime = cues[0].startTime;
  let nextStartTime = cues.length > 1 ? cues[1].startTime : -1;
  for (let i = 0; i < cues.length; ++i) {
    const currentCue = cues[i];
    if (contextStartTime >= currentCue.startTime && contextStartTime <= currentCue.endTime ||
        contextStartTime < currentCue.startTime && contextStartTime > prevEndTime) {
      contextStartIndex = i;
    }
    if (startTime >= currentCue.startTime && startTime <= currentCue.endTime ||
        startTime < currentCue.startTime && startTime > prevEndTime) {
      startIndex = i;
    }
    if (contextEndTime >= currentCue.startTime && contextEndTime <= currentCue.endTime ||
        contextEndTime > currentCue.endTime && (i === cues.length - 1 || contextEndTime < nextStartTime)) {
      contextEndIndex = i;
    }
    if (endTime >= currentCue.startTime && endTime <= currentCue.endTime ||
        endTime > currentCue.endTime && (i === cues.length - 1 || endTime < nextStartTime)) {
      endIndex = i;
    }
    prevEndTime = cues[i].endTime;
    nextStartTime = i < cues.length - 2 ? cues[i+2].startTime : -1;
  }
  return [cues.slice(startIndex, endIndex + 1).map((c) => c.text).join('\n\n'),
    cues.slice(contextStartIndex, contextEndIndex + 1).map((c) => c.text).join('\n\n')]
}

interface ChatModalProps {
  text: Nullable<string>;
  onClose: () => void;
  opened: boolean;
  src: PlayerSrc | undefined;
}

function ChatModal(props: ChatModalProps) {
  return (
    <Modal opened={props.opened} onClose={props.onClose} size='xl'>
      <Stack>
        <Text>{props.text}</Text>
        <MediaPlayer paused={false} crossOrigin={true} controls title="Explanation" src={{src: props.src as any, type: "audio/mp3"}} viewType="audio">
          <MediaProvider />
        </MediaPlayer>
      </Stack>
    </Modal>
  )  
}

function Player(props: {movieTitle: string,
    m3u8File: string, 
    thumbnailsFile?: string,
    backdropImage: string,
    subtitles: { [key:string]: Subtitle }
  }) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const playerRef = useRef(null);
  const [audioMatchingSubtitles, setAudioMatchingSubtitles] = useState<Nullable<VTTCue[]>>(null);
  const media = useMediaStore(playerRef);
  const [modalText, setModalText] = useState<Nullable<string>>(null);
  const [modalAudioSource, setModalAudioSource] = useState<PlayerSrc | undefined>(undefined);

  const onAudioTrackChange = (at: Nullable<AudioTrack>) => {
    if (!at?.language.startsWith('en')) return;
    let candidates: Subtitle[] = Object.values(props.subtitles);
    candidates = candidates.filter((s) => s.name.toLowerCase().includes('english'));
    if (candidates.length > 1) {
      candidates = candidates.filter((s) => s.name.toLowerCase().includes('full') || s.name.toLowerCase().includes('sdh'));
    }
    if (candidates.length > 1) {
      candidates = candidates.filter((s) => s.name.toLowerCase().includes('full'));
    }
    if (candidates.length === 0) return;
    parseResponse(fetch(`${candidates[0].url!}`)).then((value) => { setAudioMatchingSubtitles(() => value.cues)});
  }

  const onPause = () => {
    const arr = getLastWithContext(media.currentTime, audioMatchingSubtitles, 10, 4, 0);
    if (arr != null) {
      openaiClient.chat.completions.create({
        messages: [{
          role: 'user',
          content: `Explain phrases and words from excerpt \n${arr[0]}\n from movie ${props.movieTitle} in the following format. Just give output in the format, don't say anything else.\n <english phrase> - explanation/translation in Armenian <new line>`
        }],
        model: 'gpt-4o'
      }).then((value) => {
        const content = value.choices[0].message.content;
        setModalText(() => content);
        openaiClient.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: content!
          }).then((value2) => {
            value2.blob().then((value3) => {
              setModalAudioSource(() => URL.createObjectURL(value3));
            })
          });

        
      });
    }
  }

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      (player as any).textTracks.clear();
    }
  }, [props.m3u8File]);

  return (
    <Stack>
      <ChatModal src={modalAudioSource} opened={modalText != null} text={modalText} onClose={() => {setModalText(() => null); setModalAudioSource(() => undefined)}}/>
	  <MediaPlayer onPause={onPause} onAudioTrackChange={onAudioTrackChange} crossOrigin={true} ref={playerRef} title={`${props.movieTitle}`} src={`${props.m3u8File}`} preferNativeHLS={isSafari}>
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={`${props.thumbnailsFile}`}/>
        <Poster className="vds-poster" src={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`} />
      </MediaPlayer>
    </Stack>
  ); 
}

export default Player;
