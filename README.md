# worshipsetlist-

Monorepo: the Next.js **Chord book PDF** app lives in [`chord-sheets/`](chord-sheets/).

## Deploying the Next.js app (Vercel)

The Next.js app lives in **`chord-sheets/`**, while this repo’s root has no `next.config` there—so a default Vercel setup can build the wrong tree and serve **404 on `/`**.

This repo includes a root **[`vercel.json`](vercel.json)** that installs and builds from `chord-sheets` (`npm ci --prefix chord-sheets`, `npm run build --prefix chord-sheets`). **Redeploy** after pulling so Vercel picks it up.

**If you still see “Not Found” after redeploying:**

1. **Option A — use root `vercel.json`:** In Vercel → **Settings** → **General**, set **Root Directory** to empty / `.` (repository root). The root [`vercel.json`](vercel.json) will install and build inside `chord-sheets`.
2. **Option B — subdirectory project:** Set **Root Directory** to **`chord-sheets`** and use the default **Install** / **Build** commands (`npm ci`, `npm run build`). Do not rely on the repo-root `vercel.json` in that mode (Vercel reads config from the root directory).
3. Confirm **Framework Preset** is **Next.js**.
4. Open the deployment **Build** log: `next build` should finish and list route `/`.

### Environment variables (optional)

- `ALLOWED_FETCH_HOSTS` — comma-separated hostnames allowed for “Import from URL”. If unset, server fetch is disabled (paste-only still works).

## Local development

```bash
cd chord-sheets
npm install
npm run dev
```

Open `http://localhost:3000`.

## “Not found” when using Import from URL

That usually means the **remote page** returned HTTP 404 (wrong link, moved page, or blocked path). The app surfaces this as `Fetch failed: HTTP 404`. Fix the URL or paste the chart text instead.
