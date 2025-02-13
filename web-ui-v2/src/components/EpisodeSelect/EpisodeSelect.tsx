'use client'
import { Group, Select, SelectProps, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

interface EpisodeSelectProps {
  label: string;
  placeholder: string;
  defaultEpisodeNumber: number;
  episodes: {
    episodeNumber: number;
    episodeName: string;
  } [];
  onEpisodeSelected: (episdoeNumber: number) => void;
}

export function EpisodeSelect(props: EpisodeSelectProps) {
  const renderSelectOption: SelectProps['renderOption'] = ({ option, checked }) => {
    return (<Group flex="1" gap="xs">  
      <Text> {props.episodes.filter((s) => `${s.episodeNumber}` === option.value)[0].episodeName} </Text>
      { checked && <IconCheck /> }
    </Group>)
  };

  return (
    <Select label={props.label} allowDeselect={false} renderOption={renderSelectOption}
    placeholder={props.placeholder} defaultValue={`${props.defaultEpisodeNumber}`}
      data={
        Object.values(props.episodes).sort((a, b) => {
          return a.episodeNumber - b.episodeNumber;
        }).map(s => ({ value: `${s.episodeNumber}`, label: s.episodeName}))
      }
    onOptionSubmit={(value: string) => {
      props.onEpisodeSelected(Number.parseInt(value));
    }}
    />
  ) 
}
