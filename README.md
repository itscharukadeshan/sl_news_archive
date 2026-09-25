<!-- @format -->

# SL News Archive API

Scrapes latest news from Sri Lankan sources via Puppeteer + Browserless.

## Setup

```bash
cp .env.example .env   # set BROWSERLESS_URL
npm install
npm run dev
```

## API

- `GET /health` → `{ status: "ok" }`
- `GET /archive?url=<url>` — scrape one source (cached 5 min). `url` must be in the allowlist below; missing/invalid → `400`.
- `GET /archive-all` — scrape all sources concurrently (cached 10 min). `503` if a run is already in progress.

Valid `url` values (`src/constants/Urls.ts`):

- `https://sinhala.adaderana.lk/news_archive.php`
- `https://tamil.adaderana.lk/news_archive.php`
- `https://adaderana.lk/news_archive.php`
- `https://www.aruna.lk/categories/latest-news`
- `https://www.themorning.lk/categories/news`
- `https://www.thamilan.lk/`
- `https://www.thinakaran.lk/?s=`
- `https://www.dinamina.lk/?s=`
- `https://www.dailymirror.lk/latest-news/108`
- `https://www.tamilmirror.lk/news/175`
- `https://www.lankadeepa.lk/latest-news/1`
- `https://island.lk/?s=`
- `https://www.ada.lk/latest-news/11`
- `https://economynext.com/more-news`
- `https://www.newswire.lk/category/news/`

Response items: `{ title, url, byline, timestamp, isoTimestamp, baseUrl, checkSum }`
(`isoTimestamp` is `null` when the source date is missing/unparseable.)

## Scripts

- `npm run dev` — ts-node + nodemon
- `npm run build` — compile to `dist/`
- `npm start` — run compiled server
- `npm run typecheck` — `tsc --noEmit`

## Docker

```bash
npm run build
docker build -t sl-news-archive .
docker run -p 3001:3001 --env-file .env sl-news-archive
```

## Notes

- `archive-all` snapshots to `data/archive-<timestamp>-all.json`, pruned to the latest 20 files.
- Rate limit: 30 req/min on `/archive*`.
