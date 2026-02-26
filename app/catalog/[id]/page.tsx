import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  PAINTINGS,
  SIZE_META,
  PRICE_MATRIX,
  FORMAT_LABELS,
  formatPrice,
  getPaintingById,
} from '@/lib/paintings'
import { Gallery }       from '@/components/Gallery.client'
import { SizeSelector }  from '@/components/SizeSelector.client'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'

// ─── СТАТИЧЕСКИЕ ПАРАМЕТРЫ ────────────────────────────────────────────────────
// Генерирует страницу для каждой картины при build (SSG)

export function generateStaticParams() {
  return PAINTINGS.map(p => ({ id: p.id }))
}

// ─── SEO МЕТАДАННЫЕ ───────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const painting = getPaintingById(id)
  if (!painting) return { title: 'Картина не найдена' }

  const defaultMeta  = SIZE_META[painting.defaultSize]
  const defaultPrice = PRICE_MATRIX[painting.defaultSize]
  const pageUrl      = `${SITE_URL}/catalog/${painting.id}`
  const imageUrl     = painting.images[0]?.startsWith('http')
    ? painting.images[0]
    : `${SITE_URL}${painting.images[0]}`

  return {
    title: `${painting.name} — ${defaultMeta.label} | MoodSpace`,
    description:
      `Картина «${painting.name}» из коллекции «${painting.collection}». ` +
      `Стиль: ${painting.style}. ` +
      `Доступные размеры: ${painting.sizes.map(s => SIZE_META[s].label).join(', ')}. ` +
      `Цена от ${formatPrice(PRICE_MATRIX[painting.sizes[0]])}. Доставка по России.`,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title:       `${painting.name} — ${defaultMeta.label}`,
      description: `Коллекция «${painting.collection}» · ${painting.style} · ${defaultMeta.label} · от ${formatPrice(defaultPrice)}`,
      type:        'website',
      url:          pageUrl,
      images: painting.images[0] ? [
        {
          url:    imageUrl,
          width:  800,
          height: Math.round(800 / defaultMeta.aspect),
          alt:    painting.name,
        },
      ] : undefined,
    },
  }
}

// ─── JSON-LD PRODUCT SCHEMA ───────────────────────────────────────────────────

function ProductJsonLd({ painting }: { painting: ReturnType<typeof getPaintingById> }) {
  if (!painting) return null

  const imageUrl = painting.images[0]?.startsWith('http')
    ? painting.images[0]
    : `${SITE_URL}${painting.images[0]}`

  const minPrice = Math.min(...painting.sizes.map(s => PRICE_MATRIX[s]))
  const maxPrice = Math.max(...painting.sizes.map(s => PRICE_MATRIX[s]))

  const jsonLd = {
    '@context':   'https://schema.org',
    '@type':      'Product',
    name:         painting.name,
    description:  `Картина «${painting.name}» из коллекции «${painting.collection}». Стиль: ${painting.style}.`,
    image:         painting.images.map(img =>
      img.startsWith('http') ? img : `${SITE_URL}${img}`
    ),
    brand: {
      '@type': 'Brand',
      name:    'MoodSpace',
    },
    offers: painting.sizes.map(s => ({
      '@type':         'Offer',
      name:            SIZE_META[s].label,
      price:           PRICE_MATRIX[s],
      priceCurrency:   'RUB',
      availability:    'https://schema.org/InStock',
      url:             `${SITE_URL}/catalog/${painting.id}?size=${s}`,
      itemCondition:   'https://schema.org/NewCondition',
    })),
    aggregateOffer: {
      '@type':       'AggregateOffer',
      lowPrice:       minPrice,
      highPrice:      maxPrice,
      priceCurrency: 'RUB',
      offerCount:    painting.sizes.length,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

// ─── СТРАНИЦА ─────────────────────────────────────────────────────────────────

export default async function PaintingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const painting = getPaintingById(id)
  if (!painting) notFound()

  const idx      = PAINTINGS.findIndex(p => p.id === painting.id)
  const prev     = PAINTINGS[idx - 1]
  const next     = PAINTINGS[idx + 1]
  const defMeta  = SIZE_META[painting.defaultSize]

  return (
    <>
      <ProductJsonLd painting={painting} />

      {/* ── НАВИГАЦИЯ ── */}
      <nav className="nav">
        <Link href="/catalog" className="nav-back">← Каталог</Link>
        <div className="nav-logo">Mood<em>Space</em></div>
        <a href="https://moodspace.ru" className="nav-back" style={{ textAlign: 'right' }}>Сайт →</a>
      </nav>

      {/* ── ТЕЛО: галерея + инфо ── */}
      <div className="product-layout">

        {/* ГАЛЕРЕЯ */}
        <div className="product-gallery-col">
          <Gallery
            images={painting.images}
            name={painting.name}
            aspectRatio={defMeta.aspect}
          />
        </div>

        {/* ИНФО */}
        <div className="product-info-col">
          <div className="product-collection">{painting.collection}</div>
          <h1 className="product-name">{painting.name}</h1>
          <div className="product-style">{painting.style}</div>

          {/* SizeSelector — клиентский (цена + выбор размера + CTA) */}
          <SizeSelector painting={painting} siteUrl="https://moodspace.ru" />
        </div>
      </div>

      {/* ── PREV / NEXT ── */}
      <div className="product-nav">
        {prev ? (
          <Link href={`/catalog/${prev.id}`}>← {prev.name}</Link>
        ) : <span />}
        {next ? (
          <Link href={`/catalog/${next.id}`}>{next.name} →</Link>
        ) : <span />}
      </div>
    </>
  )
}
