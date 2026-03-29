"use client";

import { useCallback, useState } from "react";
import { transposeChordProText } from "@/lib/chords/chordpro";
import { buildChordBookPdf } from "@/lib/pdf/buildChordBookPdf";
import {
  LICENSE_LABELS,
  LICENSE_TYPES,
  type LicenseType,
} from "@/lib/song/license";

function randomId(): string {
  return crypto.randomUUID();
}

export type SongRow = {
  id: string;
  title: string;
  artist: string;
  sourceKey: string;
  targetKey: string;
  content: string;
  licenseType: LicenseType;
  attributionTitle: string;
  attributionAuthor: string;
  licenseName: string;
  citationUrl: string;
};

const emptySong = (): SongRow => ({
  id: randomId(),
  title: "",
  artist: "",
  sourceKey: "",
  targetKey: "G",
  content: "",
  licenseType: "public_domain",
  attributionTitle: "",
  attributionAuthor: "",
  licenseName: "",
  citationUrl: "",
});

function previewText(s: SongRow): string {
  const from = s.sourceKey.trim();
  const to = s.targetKey.trim();
  if (!from || !to) return s.content;
  return transposeChordProText(s.content, from, to);
}

function bodyForPdf(content: string, sourceKey: string, targetKey: string): string {
  const from = sourceKey.trim();
  const to = targetKey.trim();
  if (from && to) return transposeChordProText(content, from, to);
  return content;
}

function validateSongsForPdf(songs: SongRow[]): string | null {
  const ready = songs.filter((s) => s.title.trim() && s.targetKey.trim());
  if (ready.length === 0) {
    return "Add at least one song with a title and target key.";
  }
  for (const s of ready) {
    if (s.licenseType === "cc_by") {
      if (!s.attributionTitle.trim()) return "Each CC / attribution song needs a work title.";
      if (!s.attributionAuthor.trim()) {
        return "Each CC / attribution song needs an author or rightsholder.";
      }
      if (!s.licenseName.trim()) return "Each CC / attribution song needs a license name.";
      if (!s.citationUrl.trim()) return "Each CC / attribution song needs a source or license URL.";
      try {
        new URL(s.citationUrl.trim());
      } catch {
        return "Fix the citation URL for songs using Creative Commons / attribution.";
      }
    }
  }
  return null;
}

export default function ChordBookApp() {
  const [songs, setSongs] = useState<SongRow[]>(() => [emptySong()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rightsConfirmed, setRightsConfirmed] = useState(false);

  const update = useCallback((id: string, patch: Partial<SongRow>) => {
    setSongs((prev) =>
      prev.map((song) => (song.id === id ? { ...song, ...patch } : song)),
    );
  }, []);

  const addSong = () => setSongs((prev) => [...prev, emptySong()]);

  const removeSong = (id: string) =>
    setSongs((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.id !== id)));

  const move = (id: string, dir: -1 | 1) => {
    setSongs((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const downloadPdf = async () => {
    setError(null);
    const validationError = validateSongsForPdf(songs);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!rightsConfirmed) {
      setError(
        "Confirm that you have the rights or accurate license information for every song before downloading.",
      );
      return;
    }

    const pdfSongs = songs
      .filter((s) => s.title.trim() && s.targetKey.trim())
      .map((s) => ({
        title: s.title.trim(),
        artist: s.artist.trim() || undefined,
        targetKey: s.targetKey.trim(),
        sourceKey: s.sourceKey.trim() || undefined,
        body: bodyForPdf(s.content, s.sourceKey, s.targetKey),
        licenseType: s.licenseType,
        attributionTitle: s.attributionTitle.trim() || undefined,
        attributionAuthor: s.attributionAuthor.trim() || undefined,
        licenseName: s.licenseName.trim() || undefined,
        citationUrl: s.citationUrl.trim() || undefined,
      }));

    setBusy(true);
    try {
      const bytes = await buildChordBookPdf(pdfSongs);
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      const blob = new Blob([copy], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = "chord-book.pdf";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "PDF failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Chord book PDF</h1>
        <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Paste charts you have rights to use (public domain, your own work, or
          CC with attribution). Use ChordPro-style chords (for example{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-900">
            [G]Amazing grace
          </code>
          ). Set source and target keys to transpose, or leave source key empty to
          skip. PDFs are built <strong className="font-medium text-zinc-800 dark:text-zinc-200">in your browser</strong>—nothing is uploaded to a server.
        </p>
      </header>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={addSong}
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Add song
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          disabled={busy}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-600 disabled:opacity-50"
        >
          {busy ? "Building PDF…" : "Download PDF"}
        </button>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 rounded border-zinc-400"
          checked={rightsConfirmed}
          onChange={(e) => setRightsConfirmed(e.target.checked)}
        />
        <span className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          I confirm that for <strong>every song</strong> in this book I have the
          rights to reproduce the chart, or the material is public domain / CC as
          I selected, and my license selections are accurate. I understand this
          app does not provide legal advice.
        </span>
      </label>

      <ul className="flex flex-col gap-10">
        {songs.map((s, index) => (
          <li
            key={s.id}
            className="rounded-2xl border border-zinc-200 p-5 shadow-sm dark:border-zinc-800"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-zinc-500">
                Song {index + 1}
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => move(s.id, -1)}
                  className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => move(s.id, 1)}
                  className="text-xs text-zinc-600 hover:underline dark:text-zinc-400"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => removeSong(s.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            <label className="mb-3 flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Rights / source type
              </span>
              <select
                className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                value={s.licenseType}
                onChange={(e) =>
                  update(s.id, { licenseType: e.target.value as LicenseType })
                }
              >
                {LICENSE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LICENSE_LABELS[t]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Title</span>
                <input
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                  value={s.title}
                  onChange={(e) => update(s.id, { title: e.target.value })}
                  placeholder="Song title"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Artist (optional)
                </span>
                <input
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                  value={s.artist}
                  onChange={(e) => update(s.id, { artist: e.target.value })}
                  placeholder="Artist"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Source key (as written)
                </span>
                <input
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                  value={s.sourceKey}
                  onChange={(e) => update(s.id, { sourceKey: e.target.value })}
                  placeholder="e.g. G or Am — empty = no transpose"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Target key (printed on PDF)
                </span>
                <input
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                  value={s.targetKey}
                  onChange={(e) => update(s.id, { targetKey: e.target.value })}
                  placeholder="e.g. D"
                />
              </label>
            </div>

            {s.licenseType === "cc_by" ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Work title (for attribution)
                  </span>
                  <input
                    className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                    value={s.attributionTitle}
                    onChange={(e) =>
                      update(s.id, { attributionTitle: e.target.value })
                    }
                    placeholder="Title of the work you are citing"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm sm:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Author / rightsholder
                  </span>
                  <input
                    className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                    value={s.attributionAuthor}
                    onChange={(e) =>
                      update(s.id, { attributionAuthor: e.target.value })
                    }
                    placeholder="Name as required by the license"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    License name
                  </span>
                  <input
                    className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 dark:border-zinc-600"
                    value={s.licenseName}
                    onChange={(e) => update(s.id, { licenseName: e.target.value })}
                    placeholder="e.g. CC BY 4.0"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Source or license URL
                  </span>
                  <input
                    className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-xs dark:border-zinc-600"
                    value={s.citationUrl}
                    onChange={(e) => update(s.id, { citationUrl: e.target.value })}
                    placeholder="https://…"
                  />
                </label>
              </div>
            ) : null}

            {s.licenseType !== "cc_by" ? (
              <label className="mt-4 flex flex-col gap-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">
                  Reference URL for PDF (optional)
                </span>
                <input
                  className="rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm dark:border-zinc-600"
                  value={s.citationUrl}
                  onChange={(e) => update(s.id, { citationUrl: e.target.value })}
                  placeholder="https://…"
                />
              </label>
            ) : null}

            <label className="mt-4 flex flex-col gap-1 text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                Chord chart (ChordPro [chords] or plain text)
              </span>
              <textarea
                className="min-h-[180px] rounded-lg border border-zinc-300 bg-transparent px-3 py-2 font-mono text-sm leading-relaxed dark:border-zinc-600"
                value={s.content}
                onChange={(e) => update(s.id, { content: e.target.value })}
              />
            </label>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400">
                Preview (after transpose)
              </summary>
              <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs whitespace-pre-wrap dark:bg-zinc-900">
                {previewText(s) || "Nothing to preview yet."}
              </pre>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
