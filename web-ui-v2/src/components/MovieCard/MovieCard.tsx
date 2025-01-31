import { Link } from '@/i18n/routing';
import { Image, Text, Card, CardSection, Space } from '@mantine/core';

interface MovieCardProps {
  alt: string;

}

export const MovieCard = (props: MovieCardProps) => {
  const imageBaseUrl = "https://media-assets-cachable-prod-e1pjapsk.q62.uk/cdn-cgi/image/";
  const imagePath = "56c4b968-43fa-4d2a-9660-5680ca2f44fa/posterImagePortrait-RU.jpg";
  return (
    <Card padding="lg" radius="md">
        <CardSection>
          <Link href="https://raw.githubusercontent.com/mantinedev/mantine/master/.demo/images/bg-8.png">
            <Image
              src={`${imageBaseUrl}w=160,f=auto/${imagePath}`}
              srcSet={`${imageBaseUrl}w=240,f=auto/${imagePath} 240w, ${imageBaseUrl}w=160,f=auto/${imagePath} 160w`}
              sizes="(max-width: 1200px) 160px, 240px"
              style={{ aspectRatio: 2 / 3, background: 'url("no-image-holder.svg") no-repeat center center/contain', objectFit: "fill" }}
              alt={props.alt}
              loading='lazy'
            />
          </Link>
        </CardSection>
      <Space h='md'/>
      <Text fw={500} w='100%' style={{textAlign: "center"}}>The Shawshank Redemption (2000)</Text>
    </Card>
  );
}
