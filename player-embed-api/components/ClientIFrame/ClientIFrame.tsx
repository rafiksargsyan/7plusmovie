'use client';

import { useEffect, useState } from 'react';

export default function ClientIframe({ src, width, aspectRatio }: { src: string, width: number, aspectRatio: number }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <iframe
      src={src}
      width={width}
      height={Math.round(width / aspectRatio)}
      style={{ border: 'none', overflow: 'hidden' }}
      allowFullScreen
      loading="lazy"
    ></iframe>
  );
}
