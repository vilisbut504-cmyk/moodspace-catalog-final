import type { Metadata } from 'next'
import Link from 'next/link'
import {
  PAINTINGS,
  COLLECTIONS,
  filterPaintings,
  type Format,
  type SizeKey,
} from '@/lib/paintings'
import { PaintingCard }       from '@/components/PaintingCard'
import { CatalogFilters }     from '@/components/CatalogFilters.client'

// ─── НАСТРОЙКИ ПАГИНАЦИИ ─────────────────────────────────────────────────────
const PER_PAGE = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://catalog.moodspace.ru'

// ─── SEO ─────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}): Promise<Metadata> {
  const collection = String(searchParams.collection || '')
  const size       = String(searchParams.size || '')

  let title       = 'Каталог картин на холсте'
  let description = 'Крупноформатные картины для интерьера 80×120 — 120×240 см. 10 авторских коллекций. Доставка по России.'

  if (collection) {
    title       = `Коллекция «${collection}» — картины на холсте`
    description = `Картины коллекции «${collection}» от MoodSpace. Форматы от 80×120 до 120×240 см.`
  } else if (size) {
    title       = `Картины ${size.replace('x', '×')} см — купить на холсте`
    description = `Картины на холсте размером ${size.replace('x', '×')} см от MoodSpace. Доставка по России.`
  }

  const canonicalParams = new URLSearchParams()
  if (collection) canonicalParams.set('collection', collection)
  if (size) canonicalParams.set('size', size)
  const canonicalQuery = canonicalParams.toString()

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/catalog${canonicalQuery ? `?${canonicalQuery}` : ''}`,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url:  `${SITE_URL}/catalog`,
    },
  }
}

// ─── КОМПОНЕНТ ───────────────────────────────────────────────────────────────

export default function CatalogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const collection = String(searchParams.collection || '')
  const format     = String(searchParams.format || '') as Format | ''
  const size       = String(searchParams.size || '') as SizeKey | ''
  const page       = Math.max(1, Number(searchParams.page) || 1)

  // Фильтрация
  const filtered = filterPaintings(PAINTINGS, {
    collection: collection || undefined,
    format:     format     || undefined,
    size:       size       || undefined,
  })

  // Пагинация
  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function buildUrl(params: Record<string, string | number | null>) {
    const p = new URLSearchParams()
    if (collection)   p.set('collection', collection)
    if (format)       p.set('format', format)
    if (size)         p.set('size', size)
    for (const [k, v] of Object.entries(params)) {
      if (v === null) { p.delete(k) } else { p.set(k, String(v)) }
    }
    const q = p.toString()
    return `/catalog${q ? `?${q}` : ''}`
  }

  return (
    <div>
      {/* ── НАВИГАЦИЯ ── */}
      <nav className="nav">
        <a href="https://moodspace.ru" className="nav-back">← Сайт</a>
        <div className="nav-logo">Mood<em>Space</em></div>
        <span />
      </nav>

      {/* ── ШАПКА ── */}
      <header className="page-header">
        <div className="page-header-eyebrow">MoodSpace</div>
        <h1>Коллекции</h1>
        <p>Крупноформатные работы 80×120 — 120×240 см</p>
      </header>

      {/* ── ФИЛЬТРЫ ── */}
      <CatalogFilters
        activeCollection={collection}
        activeFormat={format}
        activeSize={size}
      />

      {/* ── ТЕЛО ── */}
      <div className="catalog-body">

        {/* САЙДБАР — содержимое приходит из CatalogFilters.client */}
        <aside className="sidebar">
          <CatalogFilters
            activeCollection={collection}
            activeFormat={format}
            activeSize={size}
          />
        </aside>

        {/* СЕТКА */}
        <main className="catalog-main">
          <div className="catalog-meta">
            <span>
              {filtered.length === 0 ? 'Нет работ'
                : filtered.length === 1 ? '1 работа'
                : filtered.length < 5  ? `${filtered.length} работы`
                : `${filtered.length} работ`}
              {totalPages > 1 && ` · стр. ${page} из ${totalPages}`}
            </span>
          </div>

          {/* Пусто */}
          {paginated.length === 0 && (
            <div className="empty-state">
              <h2>Ничего не найдено</h2>
              <p>Попробуйте изменить параметры</p>
              <Link href="/catalog" className="btn-primary" style={{ display: 'inline-flex' }}>
                Сбросить фильтры
              </Link>
            </div>
          )}

          {/* Сетка */}
          {paginated.length > 0 && (
            <div className="catalog-grid">
              {paginated.map(p => (
                <PaintingCard key={p.id} painting={p} />
              ))}
            </div>
          )}

          {/* Пагинация */}
          {totalPages > 1 && (
            <nav className="pagination" aria-label="Страницы каталога">
              <Link
                href={buildUrl({ page: page - 1 })}
                className={`page-link${page === 1 ? ' disabled' : ''}`}
                aria-disabled={page === 1}
              >
                ← Назад
              </Link>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 2)
                .reduce<(number | '...')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...' ? (
                    <span key={`dots-${i}`} style={{ padding: '8px 4px', color: 'var(--mu)' }}>…</span>
                  ) : (
                    <Link
                      key={n}
                      href={buildUrl({ page: n })}
                      className={`page-link${page === n ? ' active' : ''}`}
                      aria-current={page === n ? 'page' : undefined}
                    >
                      {n}
                    </Link>
                  )
                )
              }

              <Link
                href={buildUrl({ page: page + 1 })}
                className={`page-link${page === totalPages ? ' disabled' : ''}`}
                aria-disabled={page === totalPages}
              >
                Вперёд →
              </Link>
            </nav>
          )}

          {/* Не нашли */}
          <div className="not-found-block">
            <h3>Не нашли подходящую работу?</h3>
            <p>Подберём под ваш интерьер или создадим по вашей концепции</p>
            <a href="https://moodspace.ru/#selection" className="btn-primary" style={{ display: 'inline-flex' }}>
              Запросить подбор →
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}
