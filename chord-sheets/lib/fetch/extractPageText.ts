import * as cheerio from "cheerio";

/**
 * Strip scripts/styles and return visible text from HTML.
 */
export function htmlToPlainText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, iframe, svg").remove();
  const body = $("body");
  const text = body.length ? body.text() : $.root().text();
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
