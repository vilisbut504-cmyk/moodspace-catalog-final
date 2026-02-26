import Image from 'next/image'
import Link from 'next/link'
import { type Painting, SIZE_META, PRICE_MATRIX, formatPrice } from '@/lib/paintings'

interface Props {
  painting: Painting
}

// Server Component — никакого useState
// Hover-эффекты реализованы чисто на CSS (.painting-card в globals.css)
export function PaintingCard({ painting }: Props) {
  const meta  = SIZE_META[painting.defaultSize]
  const price = PRICE_MATRIX[painting.defaultSize]
  const src   = painting.images[0]

  // aspect-ratio для обёртки фото
  const aspectPercent = (1 / meta.aspect) * 100

  return (
    <Link href={`/catalog/${painting.id}`} className="painting-card">
      <div
        className="painting-card-img-wrap"
        style={{ paddingBottom: `${aspectPercent.toFixed(2)}%` }}
      >
        <Image
          src={src}
          alt={`${painting.name} — ${meta.label}, купить картину на холсте`}
          fill
          sizes="(max-width: 520px) 50vw, (max-width: 960px) 33vw, 25vw"
          loading="lazy"
          style={{ objectFit: 'cover' }}
          // Fallback на placeholder если файла нет
          onError={undefined}
        />
        <div className="painting-card-overlay">
          <span className="painting-card-overlay-label">Подробнее</span>
        </div>
      </div>

      <div className="painting-card-info">
        <div className="painting-card-style">{painting.style}</div>
        <div className="painting-card-name">{painting.name}</div>
        <div className="painting-card-bottom">
          <span className="painting-card-size">{meta.label}</span>
          <span className="painting-card-price">{formatPrice(price)}</span>
        </div>
      </div>
    </Link>
  )
}
