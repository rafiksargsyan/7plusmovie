import { Link } from '@/i18n/routing';
import { Image, Text, Card, CardSection, Space, Group, Badge, Stack } from '@mantine/core';

interface MovieCardProps {
  alt: string;
  quality: string;
  title: string;
  year: string;
  url: string;
  imageBaseUrl: string;
  imagePath: string;
}

export const MovieCard = (props: MovieCardProps) => {
  const imageBaseUrl = "https://media-assets-cachable-prod-e1pjapsk.q62.uk/cdn-cgi/image/";
  const imagePath = "56c4b968-43fa-4d2a-9660-5680ca2f44fa/posterImagePortrait-RU.jpg";
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
          <Group style={{flexFlow: "row-reverse wrap-reverse"}} pos="absolute" bottom={0} right={0} p={16} gap="xs">
            {props.quality && <Badge size='lg' radius='sm' color="midnightblue">{props.quality}</Badge>}
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
