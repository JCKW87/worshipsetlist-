# worshipsetlist

Single **Next.js** app: build a consolidated **chord chart PDF** in the browser—no server APIs, no URL import. Leave **Root Directory** empty (repo root).

## Deploy (Vercel)

1. Connect this repo; **Root Directory** empty (repository root).
2. **Framework**: Next.js (auto). **Build**: `npm run build`. Do **not** override **Output Directory** unless you know you need to—leave it default for Next.js.

No environment variables are required.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Preview production build locally

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```
