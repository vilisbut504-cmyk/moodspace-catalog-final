'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  images:      string[]
  name:        string
  aspectRatio: number  // width / height
}

export function Gallery({ images, name, aspectRatio }: Props) {
  const [active, setActive] = useState(0)

  // XL-версия для основного фото (заменяем .webp → _xl.webp если локальный файл)
  function getXL(src: string): string {
    if (src.startsWith('/paintings/') && src.endsWith('.webp')) {
      return src.replace('.webp', '_xl.webp')
    }
    return src
  }

  const mainSrc = getXL(images[active] || images[0])

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Основное фото */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative',
          maxHeight: '100%',
          maxWidth: '100%',
          width: `min(100%, calc(${aspectRatio} * 100%))`,
          aspectRatio: String(aspectRatio),
        }}>
          <Image
            src={mainSrc}
            alt={`${name} — картина на холсте`}
            fill
            sizes="(max-width: 960px) 100vw, 60vw"
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      </div>

      {/* Миниатюры (только если фото больше одного) */}
      {images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: 8,
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                width: 56,
                height: 56,
                padding: 0,
                border: `2px solid ${i === active ? '#C4A46B' : 'transparent'}`,
                background: '#E8E3DA',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                transition: 'border-color 0.2s',
              }}
            >
              <Image
                src={src}
                alt={`${name} — фото ${i + 1}`}
                fill
                sizes="56px"
                style={{ objectFit: 'cover' }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
