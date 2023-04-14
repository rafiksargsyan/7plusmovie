/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  i18n: {
    locales: ['ru', 'en-US'],
    defaultLocale: 'ru',
    localeDetection: false
  },
}

module.exports = nextConfig
