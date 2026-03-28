import { NextResponse } from "next/server";
import { z } from "zod";
import { transposeChordProText } from "@/lib/chords/chordpro";
import { buildChordBookPdf } from "@/lib/pdf/buildChordBookPdf";
import type { LicenseType } from "@/lib/song/license";
import { LICENSE_TYPES } from "@/lib/song/license";

const licenseTypeSchema = z.enum(
  LICENSE_TYPES as unknown as [LicenseType, ...LicenseType[]],
);

const fetchedMetaSchema = z.object({
  fetchedAt: z.string().trim().min(1).max(80),
  hostname: z.string().trim().min(1).max(255),
  url: z.string().url().max(2048),
});

const songSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    artist: z.string().trim().max(200).optional(),
    sourceKey: z.string().trim().max(20).optional(),
    targetKey: z.string().trim().min(1).max(20),
    content: z.string().max(200_000),
    licenseType: licenseTypeSchema,
    attributionTitle: z.string().trim().max(300).optional(),
    attributionAuthor: z.string().trim().max(300).optional(),
    licenseName: z.string().trim().max(200).optional(),
    citationUrl: z.string().trim().max(2048).optional(),
    fetchedMeta: fetchedMetaSchema.nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.licenseType !== "cc_by") return;

    const checks: { value: string | undefined; path: keyof typeof data; label: string }[] =
      [
        {
          value: data.attributionTitle,
          path: "attributionTitle",
          label: "Work title",
        },
        {
          value: data.attributionAuthor,
          path: "attributionAuthor",
          label: "Author / rightsholder",
        },
        { value: data.licenseName, path: "licenseName", label: "License name" },
        {
          value: data.citationUrl,
          path: "citationUrl",
          label: "Source or license URL",
        },
      ];

    for (const { value, path, label } of checks) {
      if (!value?.trim()) {
        ctx.addIssue({
          code: "custom",
          message: `${label} is required for Creative Commons / attribution license type`,
          path: [path],
        });
      }
    }

    const url = data.citationUrl?.trim();
    if (url) {
      try {
        new URL(url);
      } catch {
        ctx.addIssue({
          code: "custom",
          message: "Invalid citation URL",
          path: ["citationUrl"],
        });
      }
    }
  });

const bodySchema = z.object({
  rightsConfirmed: z.literal(true, {
    error: "You must confirm you have the rights or accurate license info for every song.",
  }),
  songs: z.array(songSchema).min(1).max(80),
});

function buildBody(
  content: string,
  sourceKey: string | undefined,
  targetKey: string,
): string {
  const from = sourceKey?.trim() ?? "";
  const to = targetKey.trim();
  if (from && to) {
    return transposeChordProText(content, from, to);
  }
  return content;
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const songs = parsed.data.songs.map((s) => ({
    title: s.title,
    artist: s.artist,
    targetKey: s.targetKey.trim(),
    sourceKey: s.sourceKey?.trim(),
    body: buildBody(s.content, s.sourceKey, s.targetKey),
    licenseType: s.licenseType,
    attributionTitle: s.attributionTitle?.trim() || undefined,
    attributionAuthor: s.attributionAuthor?.trim() || undefined,
    licenseName: s.licenseName?.trim() || undefined,
    citationUrl: s.citationUrl?.trim() || undefined,
    fetchedMeta: s.fetchedMeta ?? undefined,
  }));

  try {
    const pdfBytes = await buildChordBookPdf(songs);
    const filename = "chord-book.pdf";
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF build failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
