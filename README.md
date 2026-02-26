# MoodSpace Catalog v2

Next.js 14 (App Router) · Vercel · SEO-ready · 10 000+ изображений

---

## Быстрый старт

```bash
npm install
npm run dev
# http://localhost:3000/catalog
```

---

## Пайплайн: от папки с фото до онлайн-каталога

### Шаг 1 — Положить фото

```
public/paintings_raw/
  ├── fire_01.jpg
  ├── fire_02.jpg
  ├── water_01.jpg
  ├── art_01.png
  └── ...
```

**Нейминг для режима `prefix` (группировка):**
- `fire_01.jpg`, `fire_02.jpg` → одна картина с 2 фото
- `water_01.jpg`, `water_02.jpg` → другая картина

**Нейминг для режима `single` (по умолчанию):**
- Каждый файл = отдельный товар

**Автоопределение коллекции по названию файла:**
- `fire_*`, `огонь_*` → Огонь и пепел
- `water_*`, `воды_*` → Тихие воды
- `urban_*`, `город_*` → Урбан
- `gold_*`, `золот_*` → Золотой час
- `dark_*`, `темн_*` → Тёмная материя
- и т.д. (см. scripts/migrate-paintings.mjs → COLLECTION_KEYWORDS)

### Шаг 2 — Установить зависимости

```bash
npm install
# sharp устанавливается автоматически
```

### Шаг 3 — Запустить миграцию

```bash
# Режим single (каждый файл = товар)
npm run migrate:paintings

# Режим prefix (группировка по префиксу)
MODE=prefix npm run migrate:paintings
```

**Что происходит:**
- Конвертирует все файлы в WebP (800px + 1400px XL)
- Раскладывает в `public/paintings/p00001/01.webp`, `01_xl.webp`
- Копирует оригиналы в `public/paintings/_originals/`
- **Перезаписывает `lib/paintings.ts`** с полными данными

### Шаг 4 — Проверить локально

```bash
npm run dev
# Открыть http://localhost:3000/catalog
```

### Шаг 5 — Деплой

```bash
vercel --prod
```

Или через GitHub: пуш в main → автодеплой.

### Шаг 6 — Проверить SEO

- `https://ваш-домен/sitemap.xml` — должны быть все картины
- `https://ваш-домен/robots.txt`
- Карточка товара: открыть DevTools → Elements → искать `<script type="application/ld+json">`
- Проверить OG: https://developers.facebook.com/tools/debug/

---

## Настройка домена

В `.env.local` (или Vercel Environment Variables):

```env
NEXT_PUBLIC_SITE_URL=https://catalog.moodspace.ru
```

Vercel Dashboard → Settings → Domains → `catalog.moodspace.ru`

DNS: `catalog CNAME cname.vercel-dns.com`

---

## Структура проекта

```
moodspace-catalog/
├── app/
│   ├── layout.tsx                    — мета, шрифты
│   ├── globals.css                   — вся дизайн-система
│   ├── robots.ts                     — robots.txt
│   ├── sitemap.ts                    — sitemap.xml (авто)
│   ├── page.tsx                      — редирект → /catalog
│   └── catalog/
│       ├── page.tsx                  — Server Component, фильтры + пагинация
│       ├── [id]/page.tsx             — Server Component, SEO + JSON-LD
│       ├── collection/[slug]/page.tsx — SEO-страница коллекции
│       └── size/[size]/page.tsx      — SEO-страница размера
├── components/
│   ├── PaintingCard.tsx              — Server Component, карточка
│   ├── CatalogFilters.client.tsx     — Client, фильтры через URL
│   ├── Gallery.client.tsx            — Client, галерея с миниатюрами
│   └── SizeSelector.client.tsx      — Client, выбор размера + динамическая цена
├── lib/
│   └── paintings.ts                  — ДАННЫЕ (авто-генерация)
├── scripts/
│   └── migrate-paintings.mjs        — конвертация + генерация данных
└── public/
    ├── paintings_raw/               ← СЮДА кладём исходники
    ├── paintings/                   ← WebP (авто)
    │   ├── _originals/              ← оригиналы (авто)
    │   └── p00001/
    │       ├── 01.webp              — превью 800px
    │       └── 01_xl.webp          — большое 1400px
    └── paintings/demo/              ← демо-данные
```

---

## Изменить цены

`lib/paintings.ts` → `PRICE_MATRIX`:

```typescript
export const PRICE_MATRIX: Record<SizeKey, number> = {
  '80x120':  18900,   // ← изменить
  '100x150': 24900,
  ...
}
```

Цена обновится везде: в сетке и на странице товара.

---

## Добавить картину вручную (без скрипта)

В `lib/paintings.ts` → массив `PAINTINGS`:

```typescript
{
  id:          'p00099',
  slug:        'moya-novaya-kartina',
  name:        'Моя новая картина',
  collection:  'Тихие воды',
  style:       'Минимализм',
  sizes:       ['80x120', '100x150', '120x180'],
  defaultSize: '100x150',
  images:      ['/paintings/p00099/01.webp'],
},
```

---

## SEO страницы

| URL | Описание |
|-----|----------|
| `/catalog` | Главный каталог с фильтрами |
| `/catalog/p00001` | Карточка товара (JSON-LD Product) |
| `/catalog/collection/Тихие воды` | SEO-страница коллекции |
| `/catalog/size/120x240` | SEO-страница размера |
| `/sitemap.xml` | Sitemap всех страниц |
| `/robots.txt` | Robots |

---

## Переменные окружения

Файл `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://catalog.moodspace.ru
```

На Vercel: Dashboard → Project → Settings → Environment Variables.
