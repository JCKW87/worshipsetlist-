# worshipsetlist-

Monorepo: the Next.js **Chord book PDF** app lives in [`chord-sheets/`](chord-sheets/).

## Deploying on Vercel (required settings)

Vercel detects **Next.js** from the `package.json` that contains the `next` dependency. In this repo that file is only under **`chord-sheets/package.json`**, not at the repository root.

**You must set the Vercel project Root Directory to `chord-sheets`:**

1. Vercel → your project → **Settings** → **General**.
2. **Root Directory** → **Edit** → set to **`chord-sheets`** (not empty, not `.`).
3. Save. **Redeploy** the latest commit.

Leave **Install Command** and **Build Command** as the defaults (`npm install` / `npm ci` and `npm run build`). Framework should stay **Next.js**.

If Root Directory is left at the repo root, Vercel will not find `next` in a root `package.json` and you’ll see: *“No Next.js version detected…”*.

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
