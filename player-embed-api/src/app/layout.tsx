import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react"

const isProd = process.env.NEXT_PUBLIC_PROD === "true"

export const metadata: Metadata = {
  title: "Video Streaming API",
  description: "Video Straming API",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {isProd && <Script disable-devtool-auto src='https://cdn.jsdelivr.net/npm/disable-devtool@0.3.7'/>}
        <Script type="text/javascript" src="https://platform-api.sharethis.com/js/sharethis.js#property=680e6f7cca8688001a4309ca&product=inline-share-buttons&source=platform" />
        <Analytics />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
