# worshipsetlist

Single **Next.js** app (static export): build a consolidated **chord chart PDF** in the browser—no server APIs, no URL import, no Vercel “Root Directory” subfolder setup.

## Deploy (Vercel)

1. Connect this repo; leave **Root Directory** empty (repository root).
2. Default **Framework**: Next.js, **Build**: `npm run build`, **Output**: static (`out/` is produced automatically).

No environment variables are required.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Preview the static build locally

```bash
npm run build
npx --yes serve@14 out
```

(`next start` is for non-export apps; this project uses `output: "export"`.)

## Tests

```bash
npm test
```
