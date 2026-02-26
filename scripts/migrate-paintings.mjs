/**
 * MOODSPACE — СКРИПТ МИГРАЦИИ ФОТОГРАФИЙ
 * =========================================
 * Берёт фото из public/paintings_raw/
 * Конвертирует в WebP с несколькими размерами
 * Раскладывает в public/paintings/p00001/
 * Генерирует lib/paintings.ts
 *
 * Запуск: npm run migrate:paintings
 * Опции (env):
 *   MODE=single   — 1 файл = 1 товар (по умолчанию)
 *   MODE=prefix   — группировка по префиксу (art12_01.jpg, art12_02.jpg → один товар)
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ─── НАСТРОЙКИ ────────────────────────────────────────────────────────────────

const CONFIG = {
  // Режим группировки: 'single' | 'prefix'
  mode: process.env.MODE || 'single',

  // Откуда берём исходники
  inputDir: path.join(ROOT, 'public', 'paintings_raw'),

  // Куда кладём результат
  outputDir: path.join(ROOT, 'public', 'paintings'),

  // Куда копируем оригиналы (если null — не копируем)
  originalsDir: path.join(ROOT, 'public', 'paintings', '_originals'),

  // Куда пишем сгенерированный paintings.ts
  tsOutput: path.join(ROOT, 'lib', 'paintings.ts'),

  // Размеры превью: [ширина в пикселях, суффикс]
  // Первый = основное превью в каталоге, второй = большое для карточки
  thumbSizes: [
    { width: 800,  suffix: '' },     // p00001/01.webp — основное
    { width: 1400, suffix: '_xl' },  // p00001/01_xl.webp — большое
  ],

  // Качество WebP
  webpQuality: 85,

  // Поддерживаемые расширения исходников
  extensions: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'],

  // Начальный счётчик ID (p00001, p00002...)
  startId: 1,

  // Коллекция по умолчанию (можно переопределить через имя файла, см. ниже)
  defaultCollection: 'Без коллекции',

  // Стиль по умолчанию
  defaultStyle: 'Абстракция',
}

// ─── ПРАЙС-МАТРИЦА ────────────────────────────────────────────────────────────
// Редактируйте здесь — вставится в сгенерированный paintings.ts

const PRICE_MATRIX = {
  '80x120':  18900,
  '100x100': 21500,
  '100x150': 24900,
  '90x180':  28500,
  '120x120': 31200,
  '100x200': 34900,
  '120x180': 36500,
  '120x240': 42900,
}

// ─── РАЗМЕРЫ ──────────────────────────────────────────────────────────────────

const SIZE_META = {
  '80x120':  { label: '80×120 см',  format: 'vertical',   aspect: 80/120  },
  '100x150': { label: '100×150 см', format: 'vertical',   aspect: 100/150 },
  '120x180': { label: '120×180 см', format: 'vertical',   aspect: 120/180 },
  '90x180':  { label: '90×180 см',  format: 'vertical',   aspect: 90/180  },
  '100x200': { label: '100×200 см', format: 'vertical',   aspect: 100/200 },
  '120x240': { label: '120×240 см', format: 'vertical',   aspect: 120/240 },
  '100x100': { label: '100×100 см', format: 'square',     aspect: 1       },
  '120x120': { label: '120×120 см', format: 'square',     aspect: 1       },
}

// ─── КОЛЛЕКЦИИ ────────────────────────────────────────────────────────────────

const COLLECTIONS = [
  'Все коллекции',
  'Огонь и пепел',
  'Тихие воды',
  'Экспрессия',
  'Урбан',
  'Золотой час',
  'Серебряный туман',
  'Тёмная материя',
  'Весенний ветер',
  'Геометрия',
  'Монохром',
]

// ─── ОПРЕДЕЛЕНИЕ КОЛЛЕКЦИИ ПО ИМЕНИ ФАЙЛА ───────────────────────────────────
// Если имя файла содержит ключ — картина попадает в коллекцию.
// Например: fire_01.jpg → 'Огонь и пепел'

const COLLECTION_KEYWORDS = {
  'fire':    'Огонь и пепел',
  'огонь':   'Огонь и пепел',
  'water':   'Тихие воды',
  'воды':    'Тихие воды',
  'express': 'Экспрессия',
  'urban':   'Урбан',
  'город':   'Урбан',
  'gold':    'Золотой час',
  'золот':   'Золотой час',
  'silver':  'Серебряный туман',
  'туман':   'Серебряный туман',
  'dark':    'Тёмная материя',
  'тёмн':    'Тёмная материя',
  'темн':    'Тёмная материя',
  'spring':  'Весенний ветер',
  'весен':   'Весенний ветер',
  'geo':     'Геометрия',
  'геом':    'Геометрия',
  'mono':    'Монохром',
  'монохр':  'Монохром',
}

// ─── ХЕЛПЕРЫ ─────────────────────────────────────────────────────────────────

function padId(n) {
  return String(n).padStart(5, '0')
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zа-яё0-9\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function guessCollection(filename) {
  const lower = filename.toLowerCase()
  for (const [keyword, collection] of Object.entries(COLLECTION_KEYWORDS)) {
    if (lower.includes(keyword)) return collection
  }
  return CONFIG.defaultCollection
}

function guessDefaultSizes(aspectRatio) {
  // aspectRatio = width / height
  if (Math.abs(aspectRatio - 1) < 0.05) {
    // Квадрат
    return ['100x100', '120x120']
  } else if (aspectRatio < 0.6) {
    // Вытянутый вертикальный (1:2)
    return ['90x180', '100x200', '120x240']
  } else {
    // Стандартный вертикальный
    return ['80x120', '100x150', '120x180']
  }
}

// ─── СКАНИРОВАНИЕ ФАЙЛОВ ──────────────────────────────────────────────────────

function scanInput(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`❌ Папка не найдена: ${dir}`)
    console.log(`   Создайте её и положите туда исходные фотографии:`)
    console.log(`   mkdir -p public/paintings_raw`)
    process.exit(1)
  }

  const files = fs.readdirSync(dir)
    .filter(f => CONFIG.extensions.includes(path.extname(f).toLowerCase()))
    .sort()

  console.log(`📁 Найдено файлов: ${files.length}`)
  return files
}

// Режим prefix: группируем по части имени до первого _ или -
function groupByPrefix(files) {
  const groups = new Map()
  for (const file of files) {
    const base = path.basename(file, path.extname(file))
    // Ищем разделитель _ или - перед числом
    const match = base.match(/^(.+?)[-_](\d+)$/)
    const prefix = match ? match[1] : base
    if (!groups.has(prefix)) groups.set(prefix, [])
    groups.get(prefix).push(file)
  }
  return [...groups.entries()].map(([prefix, files]) => ({ prefix, files }))
}

// ─── КОНВЕРТАЦИЯ ──────────────────────────────────────────────────────────────

async function convertImage(srcPath, destDir, index) {
  const image = sharp(srcPath)
  const meta  = await image.metadata()
  const aspect = (meta.width || 800) / (meta.height || 1000)

  const paths = []

  for (const { width, suffix } of CONFIG.thumbSizes) {
    const filename = `${String(index).padStart(2, '0')}${suffix}.webp`
    const destPath = path.join(destDir, filename)

    await image
      .clone()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: CONFIG.webpQuality })
      .toFile(destPath)

    paths.push({ filename, suffix })
  }

  return { aspect, paths }
}

// ─── ОСНОВНОЙ ПРОЦЕСС ─────────────────────────────────────────────────────────

async function main() {
  console.log('\n🎨 MoodSpace — Migrate Paintings')
  console.log(`   Режим: ${CONFIG.mode}`)
  console.log(`   Вход:  ${CONFIG.inputDir}`)
  console.log(`   Выход: ${CONFIG.outputDir}\n`)

  const allFiles = scanInput(CONFIG.inputDir)
  if (allFiles.length === 0) {
    console.log('⚠️  Файлы не найдены. Положите исходники в public/paintings_raw/')
    process.exit(0)
  }

  // Подготовка папок
  fs.mkdirSync(CONFIG.outputDir, { recursive: true })
  if (CONFIG.originalsDir) fs.mkdirSync(CONFIG.originalsDir, { recursive: true })

  // Группировка
  let groups
  if (CONFIG.mode === 'prefix') {
    groups = groupByPrefix(allFiles)
    console.log(`   Групп (товаров): ${groups.length}\n`)
  } else {
    // single: каждый файл — отдельный товар
    groups = allFiles.map(f => ({ prefix: path.basename(f, path.extname(f)), files: [f] }))
    console.log(`   Товаров: ${groups.length}\n`)
  }

  const paintings = []
  let counter = CONFIG.startId

  for (const { prefix, files } of groups) {
    const productId = `p${padId(counter++)}`
    const productDir = path.join(CONFIG.outputDir, productId)
    fs.mkdirSync(productDir, { recursive: true })

    console.log(`  → ${productId}  (${files.length} фото)`)

    const images = []
    let aspect = 0.67  // default: 2:3

    for (let i = 0; i < files.length; i++) {
      const srcPath = path.join(CONFIG.inputDir, files[i])
      try {
        const result = await convertImage(srcPath, productDir, i + 1)
        aspect = result.aspect
        // Основное превью = первый файл без суффикса
        images.push(`/paintings/${productId}/${String(i + 1).padStart(2, '0')}.webp`)

        // Копируем оригинал
        if (CONFIG.originalsDir) {
          fs.copyFileSync(srcPath, path.join(CONFIG.originalsDir, files[i]))
        }
      } catch (err) {
        console.warn(`    ⚠️  Ошибка конвертации ${files[i]}: ${err.message}`)
      }
    }

    if (images.length === 0) continue

    const collection = guessCollection(prefix)
    const sizes      = guessDefaultSizes(aspect)
    const name       = prefix.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

    paintings.push({
      id:            productId,
      slug:          slugify(name),
      name,
      collection,
      style:         CONFIG.defaultStyle,
      sizes,
      defaultSize:   sizes[Math.floor(sizes.length / 2)] || sizes[0],
      images,
    })
  }

  // ─── ГЕНЕРАЦИЯ lib/paintings.ts ───────────────────────────────────────────

  console.log(`\n📝 Генерирую lib/paintings.ts (${paintings.length} товаров)...`)

  const tsContent = generateTS(paintings)
  fs.writeFileSync(CONFIG.tsOutput, tsContent, 'utf-8')

  console.log(`✅ Готово!`)
  console.log(`   lib/paintings.ts   — ${paintings.length} записей`)
  console.log(`   public/paintings/  — WebP превью`)
  if (CONFIG.originalsDir) {
    console.log(`   public/paintings/_originals/ — оригиналы\n`)
  }
}

// ─── ГЕНЕРАТОР TS ─────────────────────────────────────────────────────────────

function generateTS(paintings) {
  const collectionsConst = JSON.stringify(
    COLLECTIONS,
    null,
    2
  ).replace(/"([^"]+)":/g, '$1:')

  const priceConst = JSON.stringify(PRICE_MATRIX, null, 2)
    .replace(/"([^"]+)":/g, '  $1:')

  const sizeConst = Object.entries(SIZE_META)
    .map(([k, v]) => `  '${k}': { label: '${v.label}', format: '${v.format}', aspect: ${v.aspect.toFixed(4)} },`)
    .join('\n')

  const paintingsConst = paintings
    .map(p => {
      const images   = JSON.stringify(p.images)
      const sizes    = JSON.stringify(p.sizes)
      return `  {
    id:          '${p.id}',
    slug:        '${p.slug}',
    name:        '${p.name.replace(/'/g, "\\'")}',
    collection:  '${p.collection}',
    style:       '${p.style}',
    sizes:       ${sizes},
    defaultSize: '${p.defaultSize}',
    images:      ${images},
  },`
    })
    .join('\n')

  return `// ─────────────────────────────────────────────────────────────────────────────
// MOODSPACE — lib/paintings.ts
// АВТОГЕНЕРАЦИЯ: npm run migrate:paintings
// Не редактируйте вручную — изменения перезапишутся при следующем запуске скрипта.
// Чтобы добавить/изменить картины — правьте скрипт scripts/migrate-paintings.mjs
// ─────────────────────────────────────────────────────────────────────────────

// ── ТИПЫ ─────────────────────────────────────────────────────────────────────

export type Format = 'vertical' | 'horizontal' | 'square' | 'panorama'

export type SizeKey =
  | '80x120' | '100x150' | '120x180'
  | '90x180' | '100x200' | '120x240'
  | '100x100' | '120x120'

export interface Painting {
  id:          string
  slug:        string
  name:        string
  collection:  string
  style:       string
  sizes:       SizeKey[]
  defaultSize: SizeKey
  // images[0] — превью в каталоге и OG-изображение
  // images[1..] — галерея на странице товара
  images:      string[]
}

// ── КОЛЛЕКЦИИ ─────────────────────────────────────────────────────────────────

export const COLLECTIONS = ${JSON.stringify(COLLECTIONS, null, 2)} as const

export type Collection = typeof COLLECTIONS[number]

// ── ПРАЙС-МАТРИЦА ─────────────────────────────────────────────────────────────

export const PRICE_MATRIX: Record<SizeKey, number> = {
${priceConst.slice(1, -1)}
}

// ── МЕТАДАННЫЕ РАЗМЕРОВ ───────────────────────────────────────────────────────

export const SIZE_META: Record<SizeKey, { label: string; format: Format; aspect: number }> = {
${sizeConst}
}

// ── ФОРМАТЫ ───────────────────────────────────────────────────────────────────

export const FORMAT_LABELS: Record<Format, string> = {
  vertical:   'Вертикальная',
  horizontal: 'Горизонтальная',
  square:     'Квадрат',
  panorama:   'Панорама',
}

// ── КАРТИНЫ ───────────────────────────────────────────────────────────────────

export const PAINTINGS: Painting[] = [
${paintingsConst}
]

// ── ХЕЛПЕРЫ ───────────────────────────────────────────────────────────────────

export function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + '\\u00A0₽'
}

export function getPriceForSize(size: SizeKey): number {
  return PRICE_MATRIX[size]
}

export function getPaintingById(id: string): Painting | undefined {
  return PAINTINGS.find(p => p.id === id)
}

export function getPaintingBySlug(slug: string): Painting | undefined {
  return PAINTINGS.find(p => p.slug === slug)
}

export function getSrcForSize(painting: Painting, _size: SizeKey): string {
  // Если есть xl-версия для выбранного размера — используем её на странице товара
  const base = painting.images[0]
  return base.replace('.webp', '_xl.webp')
}

export function filterPaintings(paintings: Painting[], opts: {
  collection?: string
  format?:     Format
  size?:       SizeKey
}): Painting[] {
  return paintings.filter(p => {
    if (opts.collection && opts.collection !== 'Все коллекции' && p.collection !== opts.collection) return false
    if (opts.format) {
      const hasFormat = p.sizes.some(s => SIZE_META[s].format === opts.format)
      if (!hasFormat) return false
    }
    if (opts.size && !p.sizes.includes(opts.size)) return false
    return true
  })
}
`
}

main().catch(err => {
  console.error('❌ Ошибка:', err)
  process.exit(1)
})
