'use client'
import { ReleaseQuality } from "@/constants/ReleaseQuality";
import { Nullable } from "@/types/Nullable";
import { Badge, Group, Select, SelectProps, Text } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

interface ReleaseSelectProps {
  defaultReleaseId: string;
  releases: {
    [id:string]: {
      id: string,
      quality: Nullable<ReleaseQuality>;
      audioLangs: string[];
    }
  }
}

const quality2Color = {
  'CAM': 'red',
  'TELESYNC': 'orange',
  'SD': 'yellow',
  'HD': 'green',
  'FHD': 'blue'
}

export function ReleaseSelect(props: ReleaseSelectProps) {
  const renderSelectOption: SelectProps['renderOption'] = ({ option, checked }) => {
    const qualityKey = props.releases[option.value].quality?.key;
    const langs = props.releases[option.value].audioLangs.join(' • ');
    return (<Group flex="1" gap="xs">
      { qualityKey && <Badge radius='xs' color={quality2Color[qualityKey]}>{qualityKey}</Badge> }   
      <Text> {langs} </Text>
      { checked && <IconCheck /> }
    </Group>)
  };

  return (
    <Select label="Select release" allowDeselect={false} renderOption={renderSelectOption} placeholder="Select release" defaultValue={props.defaultReleaseId}
      data={
        Object.values(props.releases).map(r => ({ value: r.id, labela: '', label: `${props.releases[r.id].quality?.key}   ${props.releases[r.id].audioLangs.join(' • ')}`}))
      }
    />
  ) 
}
