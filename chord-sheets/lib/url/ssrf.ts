/**
 * Basic SSRF guard for user-supplied fetch URLs (literal host only).
 */
export function assertPublicHttpUrl(urlString: string): URL {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    throw new Error("This host is not allowed");
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const m = host.match(ipv4);
  if (m) {
    const [a, b] = [Number(m[1]), Number(m[2])];
    if (a === 10) throw new Error("Private network addresses are not allowed");
    if (a === 127) throw new Error("Private network addresses are not allowed");
    if (a === 0) throw new Error("Private network addresses are not allowed");
    if (a === 172 && b >= 16 && b <= 31) {
      throw new Error("Private network addresses are not allowed");
    }
    if (a === 192 && b === 168) {
      throw new Error("Private network addresses are not allowed");
    }
    if (a === 169 && b === 254) {
      throw new Error("Private network addresses are not allowed");
    }
  }

  return url;
}
