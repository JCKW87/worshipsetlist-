import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { LicenseType } from "@/lib/song/license";

export type PdfSongInput = {
  title: string;
  artist?: string;
  targetKey: string;
  sourceKey?: string;
  body: string;
  licenseType: LicenseType;
  attributionTitle?: string;
  attributionAuthor?: string;
  licenseName?: string;
  citationUrl?: string;
};

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function sanitizeForPdf(s: string): string {
  return s
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201c|\u201d/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .split("")
    .map((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code >= 32 && code <= 255 ? ch : "?";
    })
    .join("");
}

function wrapLine(
  line: string,
  maxWidth: number,
  fontSize: number,
  font: PDFFont,
): string[] {
  const trimmed = line.trimEnd();
  if (trimmed.length === 0) return [""];

  const words = trimmed.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function rightsAndSourceLines(s: PdfSongInput): string[] {
  const lines: string[] = [];
  switch (s.licenseType) {
    case "public_domain":
      lines.push(
        "Rights: Public domain (user-declared). Verify copyright status for your jurisdiction before public use.",
      );
      break;
    case "original_or_permission":
      lines.push(
        "Rights: Original work or used with permission (user-declared).",
      );
      break;
    case "cc_by":
      lines.push(
        `Rights: ${(s.licenseName ?? "").trim()} — Work: ${(s.attributionTitle ?? "").trim()} by ${(s.attributionAuthor ?? "").trim()}. Source / license: ${(s.citationUrl ?? "").trim()}`,
      );
      break;
    case "paste_only_no_fetch":
      lines.push(
        "Rights: User-pasted chart. License selection is the user’s responsibility.",
      );
      break;
  }

  const cite = s.citationUrl?.trim();
  if (cite && s.licenseType !== "cc_by") {
    lines.push(`Reference URL: ${cite}`);
  }

  return lines;
}

export async function buildChordBookPdf(
  songs: PdfSongInput[],
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const margin = 48;
  const fontSize = 10.5;
  const smallSize = 9;
  const titleSize = 15;
  const lineHeight = fontSize * 1.4;
  const titleLineHeight = titleSize * 1.25;
  const maxWidth = A4_WIDTH - margin * 2;

  let page: PDFPage = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let cursorY = A4_HEIGHT - margin;

  const newPage = () => {
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    cursorY = A4_HEIGHT - margin;
  };

  const ensureSpace = (h: number) => {
    if (cursorY - h < margin + fontSize) {
      newPage();
    }
  };

  for (let i = 0; i < songs.length; i++) {
    const s = songs[i];

    if (i > 0) {
      ensureSpace(lineHeight * 2);
      cursorY -= lineHeight * 0.75;
    }

    const titleText = sanitizeForPdf(s.title);
    const titleLines = wrapLine(titleText, maxWidth, titleSize, fontBold);
    for (const tl of titleLines) {
      ensureSpace(titleLineHeight);
      page.drawText(tl, {
        x: margin,
        y: cursorY - titleSize,
        size: titleSize,
        font: fontBold,
        color: rgb(0.08, 0.08, 0.1),
      });
      cursorY -= titleLineHeight;
    }
    cursorY -= 4;

    const metaParts: string[] = [];
    if (s.artist) metaParts.push(`Artist: ${sanitizeForPdf(s.artist)}`);
    metaParts.push(`Key: ${sanitizeForPdf(s.targetKey)}`);
    if (s.sourceKey?.trim() && s.sourceKey.trim() !== s.targetKey.trim()) {
      metaParts.push(`From: ${sanitizeForPdf(s.sourceKey.trim())}`);
    }
    const meta = sanitizeForPdf(metaParts.join("  |  "));
    const metaWrapped = wrapLine(meta, maxWidth, smallSize, font);
    for (const ml of metaWrapped) {
      ensureSpace(lineHeight);
      page.drawText(ml, {
        x: margin,
        y: cursorY - smallSize,
        size: smallSize,
        font,
        color: rgb(0.35, 0.35, 0.38),
      });
      cursorY -= lineHeight * 0.95;
    }

    cursorY -= 6;

    const bodyLines = s.body.split("\n");
    for (const raw of bodyLines) {
      const wrapped = wrapLine(raw, maxWidth, fontSize, font);
      for (const wl of wrapped) {
        ensureSpace(lineHeight);
        page.drawText(sanitizeForPdf(wl), {
          x: margin,
          y: cursorY - fontSize,
          size: fontSize,
          font,
          color: rgb(0.05, 0.05, 0.07),
        });
        cursorY -= lineHeight;
      }
    }

    cursorY -= lineHeight * 0.5;

    const rightsSize = smallSize - 0.5;
    const rightsLines = rightsAndSourceLines(s);
    for (const rl of rightsLines) {
      const wrapped = wrapLine(rl, maxWidth, rightsSize, font);
      for (const wl of wrapped) {
        ensureSpace(lineHeight * 0.95);
        page.drawText(sanitizeForPdf(wl), {
          x: margin,
          y: cursorY - rightsSize,
          size: rightsSize,
          font,
          color: rgb(0.42, 0.42, 0.45),
        });
        cursorY -= lineHeight * 0.95;
      }
    }

    cursorY -= lineHeight * 0.35;
  }

  return doc.save();
}
