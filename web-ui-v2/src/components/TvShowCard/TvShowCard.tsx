import { Link } from '@/i18n/routing';
import { Nullable } from '@/types/Nullable';
import { Image, Text, Card, CardSection, Space, Group, Badge, Stack } from '@mantine/core';

interface TvShowCardProps {
  alt: string;
  title: string;
  year: string;
  url: string;
  season: Nullable<number>;
  episode: Nullable<number>;
  imageBaseUrl: string;
  imagePath: string;
}

export const TvShowCard = (props: TvShowCardProps) => {
  const episodeStr = props.season != null && props.episode != null && `S${props.season}E${props.episode}` || null;
  return (
    <Card padding="lg" radius="md">
      <CardSection pos="relative">
        <Link href={props.url}>
          <Image
            src={`${props.imageBaseUrl}w=160,f=auto/${props.imagePath}`}
            srcSet={`${props.imageBaseUrl}w=240,f=auto/${props.imagePath} 240w, ${props.imageBaseUrl}w=160,f=auto/${props.imagePath} 160w`}
            sizes="(max-width: 1200px) 160px, 240px"
            style={{ aspectRatio: 2 / 3, background: 'url("no-image-holder.svg") no-repeat center center/contain', objectFit: "fill" }}
            alt={props.alt}
            loading='lazy'
          />
          <Group pos="absolute" top={0} right={0} p={16} gap="xs">
            { episodeStr && <Badge size='lg' radius='sm' color="black">{episodeStr}</Badge> }
          </Group>
        </Link>
      </CardSection>
      <Space h='md'/>
      <Stack align="center" gap='0' w='100%'>
        <Text w={{base: 150, xs: 150, sm: 170, md: 170, lg: 170, xl: 220}} fw={500} style={{textAlign: "center", display: "block", textOverflow: "ellipsis",
          overflow: "hidden", whiteSpace: "nowrap"}}>{props.title}</Text>
        <Text fw={500} style={{textAlign: "center"}}>{props.year}</Text>
      </Stack>
    </Card>
  );
}
