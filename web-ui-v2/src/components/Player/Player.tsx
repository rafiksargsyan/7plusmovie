import { AudioTrack, MediaPlayer, MediaProvider, PlayerSrc, Poster, useMediaStore } from '@vidstack/react';
import { defaultLayoutIcons, DefaultVideoLayout } from '@vidstack/react/player/layouts/default';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';
import { useEffect, useRef, useState } from 'react';
import { Nullable } from '@/types/Nullable';
import { ActionIcon, Group, Modal, Select, Stack, Title, Text, Loader } from '@mantine/core';
import { IconWand } from '@tabler/icons-react';
import OpenAI from 'openai';
import { VTTCue } from 'media-captions';
import { Subtitle } from '@/app/[locale]/movie/movie-page';
import { parseResponse } from 'media-captions';
import { useDisclosure } from '@mantine/hooks';

const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL!;

const openai = new OpenAI({
    apiKey: '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',
    dangerouslyAllowBrowser: true  
});

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

interface AiResponseModalProps {
  text: Nullable<string>;
  onClose: () => void;
  opened: boolean;
  audioSrc: PlayerSrc | undefined;
  loading: boolean;
}

function AiResponseModal(props: AiResponseModalProps) {
  return (
    <Modal mih={500} opened={props.opened} onClose={props.onClose} size='xl'>
      {!props.loading ? <Stack>
        <Text>{props.text}</Text>
        <MediaPlayer paused={false} crossOrigin={true} controls title="AI explanation"
        src={{src: props.audioSrc as any, type: "audio/mp3"}} viewType="audio">
          <MediaProvider />
        </MediaPlayer>
      </Stack> : <Stack align='center'><Text>Generating AI explanation...</Text><Loader type='bars'/></Stack>}
    </Modal>
  )  
}

function findMatchingSub(lang: string, subtitles: {[key:string]: Subtitle}) {
  let candidates = Object.entries(subtitles);
  candidates = candidates.filter((c) => c[1].lang.toLowerCase().startsWith(lang));
  if (candidates.length > 1) {
    candidates = candidates.filter((c) => c[1].type == null || c[1].type === "FULL" || c[1].type === "SDH");
  }
  if (candidates.length > 1) {
    candidates = candidates.filter((c) => c[1].type == null || c[1].type === "FULL");
  }
  if (candidates.length === 0) return null;
  return candidates[0][0];
}

function Player(props: {movieTitle: string, m3u8File: string, thumbnailsFile?: string,
    backdropImage: string, originalLocale?: Nullable<string>, subtitles: { [key:string]: Subtitle }}) {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const playerRef = useRef(null);
  const media = useMediaStore(playerRef);
  const [audiosWithAiSupport, setAudiosWithAiSupport] = useState<{ [key:string]: string }>({});
  const [curAudioSubs, setCurAudioSubs] = useState<Nullable<VTTCue[]>>(null);
  const [aiResponseModalText, setAiResponseModalText] = useState<string | null>(null);
  const [aiResponseModalAudioSource, setAiResponseModalAudioSource] = useState<PlayerSrc | undefined>(undefined);
  const [aiResponseModalOpened, aiResponseModalControl] = useDisclosure();
  const [aiResponseModalConfig, setAiResponseModalConfig] = useState<{time: number, maxWords: number} | null>(null);
  const [aiExplanationLanguage, setAiExplanationLanguage] = useState<string>("Armenian");
  const [languageLevel, setLanguageLevel] = useState<string>("Intermediate");
  const [aiModalLoading, setAiModalLoading] = useState<boolean>(false);

  const onAudioTrackChange = (at: AudioTrack | null) => {
    if (at == null) return;
    if (at?.label in audiosWithAiSupport) {
      parseResponse(fetch(`${props.subtitles[audiosWithAiSupport[at.label]].url!}`))
      .then((value) => { setCurAudioSubs(() => value.cues)});
    } else {
      setCurAudioSubs(() => null);
    }
  }

  const onLoadedMetadata = () => {
    const player = playerRef.current as any;
    if (props.originalLocale == null) return;
    const audiosWithAiSupport: {[key:string]: string} = (player.audioTracks.toArray() as AudioTrack[])
    .filter((at) => at.language.startsWith(props.originalLocale?.toLowerCase()?.split('_')[0] || "adsfadf"))
    .reduce((acc: {[key:string]: string}, at: AudioTrack) => {
      const subKey = findMatchingSub(at.language.split('-')[0], props.subtitles);
      if (subKey != null) {
        acc[at.label] = subKey;  
      }
      return acc;
    }, {});
    player.audioTracks.toArray().forEach((at: AudioTrack) => {
      if (at.selected) {
        if (at?.label in audiosWithAiSupport) {
          parseResponse(fetch(`${props.subtitles[audiosWithAiSupport[at.label]].url!}`))
          .then((value) => { setCurAudioSubs(() => value.cues)});
        } else {
          setCurAudioSubs(() => null);
        }
      }
    });
    setAudiosWithAiSupport(() => audiosWithAiSupport);
  }
  const onAiButtonClick = (time: number, maxWords: number) => (() => {
    setAiResponseModalConfig(() => ({ time: time, maxWords: maxWords }));
    aiResponseModalControl.open();
  });

  useEffect(() => {
      let ignore = false
      setAiModalLoading(true);
      const arr = getLastWithContext(media.currentTime, curAudioSubs, 10, aiResponseModalConfig?.time || 1.5, 0);
    if (arr != null) {
      const content = `Imagine you are a language teacher and explain phrases from
 '${arr[0]}' to ${languageLevel} level listener whose native language is ${aiExplanationLanguage}. Please be concise (not more than ${aiResponseModalConfig?.maxWords || 50} words overall) and 
 imagine you are speaking directly to the listener. Don't use any other language than the phrase itself and ${aiExplanationLanguage} for explanation. First
  say the phrase, then explain. Also explain separate words that might be difficult for the level of listener to understand`;
      openai.chat.completions.create({
        messages: [{
          role: 'user',
          content: content
        }],
        model: 'gpt-4o'
      }).then((value) => {
        const content = value.choices[0].message.content;
        openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: content!
          }).then((value2) => {
            value2.blob().then((value3) => {
              if (!ignore) {
                setAiResponseModalText(() => content);  
                setAiResponseModalAudioSource(() => URL.createObjectURL(value3));
                setAiModalLoading(false);
              }
            })
          });
      });
    }
    return () => { ignore = true };
  }, [aiResponseModalOpened])

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      (player as any).textTracks.clear();
    }
  }, [props.m3u8File]);

  return (
    <Stack>
      <Stack>
        <Title size='h2'>AI assistant configuration</Title>
        <Group>
          <Select allowDeselect={false} label="Select explanation language for AI assistant" data={["English", "Armenian", "Russian", "Spanish"]}
          defaultValue={aiExplanationLanguage}
          onChange={(value) => setAiExplanationLanguage(() => value!)}/>
          <Select allowDeselect={false} label="Select your language level" data={["Beginner", "Elementary", "Intermediate", "Upper-intermediate", "Advanced", "Proficiency"]}
          defaultValue={languageLevel}
          onChange={(value) => setLanguageLevel(() => value!)}/>
        </Group>
        <Group>
          <ActionIcon size='xl' radius='xl' onClick={onAiButtonClick(5, 100)}>
            <IconWand/>
          </ActionIcon>
          <ActionIcon size='lg' radius='xl' onClick={onAiButtonClick(3, 50)}>
            <IconWand/>  
          </ActionIcon>
          <ActionIcon size='md' radius='xl' onClick={onAiButtonClick(1.5, 30)}>
            <IconWand/>
          </ActionIcon>
          {<AiResponseModal text={aiResponseModalText} onClose={function (): void {
                     aiResponseModalControl.close();
                     setAiResponseModalAudioSource(() => undefined);
                     setAiResponseModalText(() => null);
                  } } opened={aiResponseModalOpened} loading={aiModalLoading} audioSrc={aiResponseModalAudioSource} />}
        </Group>
      </Stack>
	  <MediaPlayer paused={aiResponseModalOpened} onAudioTrackChange={onAudioTrackChange} onLoadedMetadata={onLoadedMetadata}
      ref={playerRef} title={`${props.movieTitle}`} src={`${props.m3u8File}`} preferNativeHLS={isSafari}>
        <MediaProvider />
        <DefaultVideoLayout icons={defaultLayoutIcons} thumbnails={`${props.thumbnailsFile}`}/>
        <Poster className="vds-poster" src={`${imageBaseUrl}h=720,f=auto/${props.backdropImage}`} />
      </MediaPlayer>
    </Stack>
  ); 
}

export default Player;
