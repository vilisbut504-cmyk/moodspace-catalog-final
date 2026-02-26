'use client'

import { useState } from 'react'
import {
  type Painting,
  type SizeKey,
  SIZE_META,
  PRICE_MATRIX,
  FORMAT_LABELS,
  formatPrice,
} from '@/lib/paintings'

interface Props {
  painting:    Painting
  siteUrl:     string
}

export function SizeSelector({ painting, siteUrl }: Props) {
  const [selected, setSelected] = useState<SizeKey>(painting.defaultSize)

  const meta  = SIZE_META[selected]
  const price = PRICE_MATRIX[selected]

  return (
    <>
      {/* Динамическая цена */}
      <div className="product-price">{formatPrice(price)}</div>
      <div className="product-price-sub">
        Холст · хлопок 380 г/м² · подрамник 50 мм
      </div>

      {/* Размеры */}
      <div className="size-heading">Размер</div>
      <div className="size-grid">
        {painting.sizes.map(s => (
          <button
            key={s}
            onClick={() => setSelected(s)}
            className={`size-btn${selected === s ? ' active' : ''}`}
          >
            <span>{SIZE_META[s].label}</span>
            <span className="size-price">{formatPrice(PRICE_MATRIX[s])}</span>
          </button>
        ))}
      </div>

      {/* Характеристики выбранного размера */}
      <div className="product-specs">
        <div className="spec">
          <span className="spec-label">Формат</span>
          <span className="spec-value">{FORMAT_LABELS[meta.format]}</span>
        </div>
        <div className="spec">
          <span className="spec-label">Размер</span>
          <span className="spec-value">{meta.label}</span>
        </div>
        <div className="spec">
          <span className="spec-label">Производство</span>
          <span className="spec-value">3–5 дней</span>
        </div>
      </div>

      {/* CTA */}
      <div className="product-cta">
        <a
          href={`${siteUrl}/order?id=${painting.id}&size=${selected}`}
          className="btn-primary"
        >
          Заказать · {formatPrice(price)}
        </a>
        <a
          href={`${siteUrl}/#consultation`}
          className="btn-secondary"
        >
          Спросить консультанта
        </a>
      </div>

      <p className="product-delivery">
        Доставка по всей России · упаковка в жёсткий короб ·
        {' '}безусловная гарантия — переделаем или вернём деньги
      </p>
    </>
  )
}
