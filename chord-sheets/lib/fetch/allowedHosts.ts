/**
 * Hostnames permitted for server-side page fetch (comma-separated env).
 * Empty list disables all fetches.
 */
export function parseAllowedFetchHostsFromEnv(envValue: string | undefined): string[] {
  const raw = envValue ?? "";
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/^\.+/, ""))
    .filter(Boolean);
}

/**
 * True if hostname matches an allowed entry exactly or is a subdomain of it.
 * Example: allow "example.org" → allows "example.org" and "www.example.org".
 */
export function isHostnameAllowedForFetch(
  hostname: string,
  allowedHosts: string[],
): boolean {
  const h = hostname.toLowerCase();
  return allowedHosts.some((entry) => {
    if (h === entry) return true;
    if (h.endsWith(`.${entry}`)) return true;
    return false;
  });
}

export function assertFetchHostAllowed(
  hostname: string,
  allowedHosts: string[],
): void {
  if (allowedHosts.length === 0) {
    throw new Error(
      "Server fetch is disabled. Set ALLOWED_FETCH_HOSTS to a comma-separated list of trusted hosts (public-domain or CC publishers), or paste charts manually.",
    );
  }
  if (!isHostnameAllowedForFetch(hostname, allowedHosts)) {
    throw new Error(
      `This host is not in ALLOWED_FETCH_HOSTS. Only administrator-approved sites may be fetched. You can still paste text from any lawful source.`,
    );
  }
}
