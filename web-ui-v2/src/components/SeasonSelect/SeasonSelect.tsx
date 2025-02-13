'use client'
import { Group, Select, SelectProps, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

interface SeasonSelectProps {
  label: string;
  placeholder: string;  
  defaultSeasonNumber: number;
  seasons: {
    seasonNumber: number;
    seasonName: string;
  } [];
  onSeasonSelected: (seasonNumber: number) => void;
}

export function SeasonSelect(props: SeasonSelectProps) {
  const renderSelectOption: SelectProps['renderOption'] = ({ option, checked }) => {
    return (<Group flex="1" gap="xs">  
      <Text> {props.seasons.filter((s) => `${s.seasonNumber}` === option.value)[0].seasonName} </Text>
      { checked && <IconCheck /> }
    </Group>)
  };

  return (
    <Select label={props.label} allowDeselect={false} renderOption={renderSelectOption}
    placeholder={props.placeholder} defaultValue={`${props.defaultSeasonNumber}`}
      data={
        Object.values(props.seasons).sort((a, b) => {
          return a.seasonNumber - b.seasonNumber;
        }).map(s => ({ value: `${s.seasonNumber}`, label: s.seasonName}))
      }
    onOptionSubmit={(value: string) => {
      props.onSeasonSelected(Number.parseInt(value));
    }}
    />
  ) 
}
