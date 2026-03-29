# worshipsetlist-

Monorepo: the Next.js **Chord book PDF** app lives in [`chord-sheets/`](chord-sheets/).

## Deploying the Next.js app (Vercel / similar)

If the live site shows **404 / “Not Found”** but `npm run dev` works locally, the host is almost certainly building from the **repo root** instead of the app folder.

1. Open the project on Vercel → **Settings** → **General**.
2. Set **Root Directory** to `chord-sheets` (not `.` or empty).
3. Save and **Redeploy** (Deployments → … → Redeploy).

Framework should be **Next.js**; install/build commands can stay default (`npm install`, `npm run build`) once the root directory is correct.

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
