/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      // Яндекс.Диск
      { protocol: 'https', hostname: 'downloader.disk.yandex.ru' },
      { protocol: 'https', hostname: '*.yandex.net' },
      // Vercel Blob
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // Tilda CDN
      { protocol: 'https', hostname: 'static.tildacdn.com' },
    ],
  },
}

module.exports = nextConfig
