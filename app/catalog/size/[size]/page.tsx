import type { Metadata } from 'next'
import { PAINTINGS, SIZE_META, filterPaintings, type SizeKey } from '@/lib/paintings'
import { PaintingCard } from '@/components/PaintingCard'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'
const VALID_SIZES: SizeKey[] = ['80x120', '100x150', '120x180', '90x180', '100x200', '120x240', '100x100', '120x120']

export function generateStaticParams() {
  return VALID_SIZES.map(size => ({ size }))
}

export async function generateMetadata({ params }: { params: { size: string } }): Promise<Metadata> {
  const size  = params.size as SizeKey
  const meta  = SIZE_META[size]
  const label = meta ? meta.label : params.size
  return {
    title:       `Картины ${label} — купить на холсте | MoodSpace`,
    description: `Картины на холсте размером ${label}. ${meta?.format === 'square' ? 'Квадратный формат.' : 'Вертикальный формат.'} Доставка по России.`,
    alternates:  { canonical: `${SITE_URL}/catalog/size/${params.size}` },
    openGraph: {
      title:       `Картины ${label}`,
      description: `Крупноформатные картины на холсте ${label} от MoodSpace`,
      url:         `${SITE_URL}/catalog/size/${params.size}`,
    },
  }
}

export default function SizePage({
  params,
  searchParams,
}: {
  params:       { size: string }
  searchParams: Record<string, string | undefined>
}) {
  const size     = params.size as SizeKey
  const meta     = SIZE_META[size]
  const page     = Math.max(1, Number(searchParams.page) || 1)
  const PER_PAGE = 60
  const filtered = filterPaintings(PAINTINGS, { size: VALID_SIZES.includes(size) ? size : undefined })
  const total    = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <nav className="nav">
        <Link href="/catalog" className="nav-back">← Каталог</Link>
        <div className="nav-logo">Mood<em>Space</em></div>
        <span />
      </nav>

      <header className="page-header">
        <div className="page-header-eyebrow">Размер</div>
        <h1>{meta?.label ?? params.size}</h1>
        <p>{filtered.length} работ · {meta ? (meta.format === 'square' ? 'Квадрат' : 'Вертикальный формат') : ''}</p>
      </header>

      <div style={{ padding: 'clamp(20px,3vh,36px) clamp(20px,5vw,80px)' }}>
        {paginated.length === 0 ? (
          <div className="empty-state">
            <h2>Работ этого размера пока нет</h2>
            <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
              Весь каталог
            </Link>
          </div>
        ) : (
          <div className="catalog-grid">
            {paginated.map(p => <PaintingCard key={p.id} painting={p} />)}
          </div>
        )}

        {total > 1 && (
          <nav className="pagination">
            {Array.from({ length: total }, (_, i) => i + 1).map(n => (
              <Link
                key={n}
                href={`/catalog/size/${size}?page=${n}`}
                className={`page-link${page === n ? ' active' : ''}`}
              >
                {n}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </div>
  )
}
