import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertFetchHostAllowed,
  parseAllowedFetchHostsFromEnv,
} from "@/lib/fetch/allowedHosts";
import { htmlToPlainText } from "@/lib/fetch/extractPageText";
import { assertPublicHttpUrl } from "@/lib/url/ssrf";

const bodySchema = z.object({
  url: z.string().url().max(2048),
});

const MAX_BYTES = 2_000_000;

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

  let safeUrl: URL;
  try {
    safeUrl = assertPublicHttpUrl(parsed.data.url);
    const allowedHosts = parseAllowedFetchHostsFromEnv(
      process.env.ALLOWED_FETCH_HOSTS,
    );
    assertFetchHostAllowed(safeUrl.hostname, allowedHosts);
  } catch (e) {
    const message = e instanceof Error ? e.message : "URL not allowed";
    const status =
      message.includes("ALLOWED_FETCH_HOSTS") ||
      message.includes("not in ALLOWED_FETCH_HOSTS")
        ? 403
        : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch(safeUrl.toString(), {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "ChordSheetsFetcher/1.0 (+https://github.com/) Mozilla/5.0 compatible",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: HTTP ${res.status}` },
        { status: 502 },
      );
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { error: "Page is too large to import" },
        { status: 413 },
      );
    }

    const html = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    const text = htmlToPlainText(html);

    return NextResponse.json({
      text,
      fetchedUrl: safeUrl.toString(),
      hostname: safeUrl.hostname,
    });
  } catch (e) {
    clearTimeout(timeout);
    const message =
      e instanceof Error ? e.message : "Failed to fetch page";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
