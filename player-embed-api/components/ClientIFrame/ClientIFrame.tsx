'use client';

import { useEffect, useState } from 'react';

export default function ClientIframe({ src }: { src: string }) {
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
      width="100%"
      height="100%"
      style={{ border: 'none' }}
      allowFullScreen
      loading="lazy"
      scrolling="no"
    ></iframe>
  );
}
