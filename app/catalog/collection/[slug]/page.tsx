import type { Metadata } from 'next'
import { PAINTINGS, COLLECTIONS, filterPaintings } from '@/lib/paintings'
import { PaintingCard } from '@/components/PaintingCard'
import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'
const PER_PAGE = 60

export function generateStaticParams() {
  return COLLECTIONS
    .filter(c => c !== 'Все коллекции')
    .map(col => ({ slug: encodeURIComponent(col) }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const col = decodeURIComponent(params.slug)
  return {
    title:       `Коллекция «${col}» — картины на холсте | MoodSpace`,
    description: `Картины коллекции «${col}» от MoodSpace. Крупноформатные работы 80×120 — 120×240 см. Доставка по России.`,
    alternates:  { canonical: `${SITE_URL}/catalog/collection/${params.slug}` },
    openGraph: {
      title:       `Коллекция «${col}»`,
      description: `Авторские картины на холсте — коллекция «${col}»`,
      url:         `${SITE_URL}/catalog/collection/${params.slug}`,
    },
  }
}

export default function CollectionPage({
  params,
  searchParams,
}: {
  params:       { slug: string }
  searchParams: Record<string, string | undefined>
}) {
  const collection = decodeURIComponent(params.slug)
  const page       = Math.max(1, Number(searchParams.page) || 1)
  const filtered   = filterPaintings(PAINTINGS, { collection })
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div>
      <nav className="nav">
        <Link href="/catalog" className="nav-back">← Каталог</Link>
        <div className="nav-logo">Mood<em>Space</em></div>
        <span />
      </nav>

      <header className="page-header">
        <div className="page-header-eyebrow">Коллекция</div>
        <h1>{collection}</h1>
        <p>{filtered.length} работ · крупноформатный холст</p>
      </header>

      <div style={{ padding: 'clamp(20px,3vh,36px) clamp(20px,5vw,80px)' }}>
        {paginated.length === 0 ? (
          <div className="empty-state">
            <h2>В этой коллекции пока нет работ</h2>
            <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex', marginTop: 16 }}>
              Весь каталог
            </Link>
          </div>
        ) : (
          <div className="catalog-grid">
            {paginated.map(p => <PaintingCard key={p.id} painting={p} />)}
          </div>
        )}

        {totalPages > 1 && (
          <nav className="pagination">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <Link
                key={n}
                href={`/catalog/collection/${params.slug}?page=${n}`}
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
