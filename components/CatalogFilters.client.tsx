'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { COLLECTIONS, FORMAT_LABELS, SIZE_META, type Format, type SizeKey } from '@/lib/paintings'

const ALL_SIZES = Object.keys(SIZE_META) as SizeKey[]

interface Props {
  activeCollection: string
  activeFormat:     string
  activeSize:       string
}

export function CatalogFilters({ activeCollection, activeFormat, activeSize }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    // При смене фильтра — сброс на первую страницу
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  function toggleCollection(col: string) {
    const next = activeCollection === col ? '' : col
    updateParam('collection', next || null)
  }

  function toggleFormat(f: Format) {
    const next = activeFormat === f ? '' : f
    updateParam('format', next || null)
  }

  function toggleSize(s: SizeKey) {
    const next = activeSize === s ? '' : s
    updateParam('size', next || null)
  }

  function resetAll() {
    router.push(pathname)
  }

  const hasFilters = activeCollection || activeFormat || activeSize

  return (
    <>
      {/* ── ФИЛЬТРЫ СВЕРХУ ── */}
      <div className="filters-bar">
        {/* Формат */}
        <div className="filter-row">
          <span className="filter-row-label">Формат</span>
          <div className="filter-tags">
            {(Object.keys(FORMAT_LABELS) as Format[]).map(f => (
              <button
                key={f}
                onClick={() => toggleFormat(f)}
                className={`filter-btn${activeFormat === f ? ' active' : ''}`}
              >
                {FORMAT_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Размер */}
        <div className="filter-row">
          <span className="filter-row-label">Размер</span>
          <div className="filter-tags">
            {ALL_SIZES.map(s => (
              <button
                key={s}
                onClick={() => toggleSize(s)}
                className={`filter-btn${activeSize === s ? ' active' : ''}`}
              >
                {SIZE_META[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* Палитра — в разработке */}
        <div className="filter-row">
          <span className="filter-row-label" style={{ color: 'rgba(26,26,24,.2)' }}>Палитра</span>
          <span className="filter-coming-soon">Скоро</span>
        </div>
      </div>

      {/* ── САЙДБАР: КОЛЛЕКЦИИ ── */}
      {/* Этот блок рендерится внутри .catalog-body > .sidebar */}
      <div className="sidebar-heading">Коллекции</div>
      <nav className="sidebar-nav">
        {COLLECTIONS.map(col => (
          <button
            key={col}
            onClick={() => toggleCollection(col === 'Все коллекции' ? '' : col)}
            className={`col-btn${activeCollection === col || (!activeCollection && col === 'Все коллекции') ? ' active' : ''}`}
          >
            {col}
          </button>
        ))}
      </nav>

      {hasFilters && (
        <button onClick={resetAll} className="reset-btn">
          Сбросить фильтры
        </button>
      )}
    </>
  )
}
