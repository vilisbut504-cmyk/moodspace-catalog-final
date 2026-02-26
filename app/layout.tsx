import type { Metadata } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'

export const metadata: Metadata = {
  metadataBase:  new URL(SITE_URL),
  title: {
    template: '%s | MoodSpace',
    default:  'Каталог картин | MoodSpace',
  },
  description:
    'Крупноформатные картины на холсте для интерьера. Форматы 80×120 — 120×240 см. ' +
    '10 авторских коллекций. Доставка по всей России.',
  openGraph: {
    type:        'website',
    siteName:    'MoodSpace',
    locale:      'ru_RU',
    url:         SITE_URL,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
