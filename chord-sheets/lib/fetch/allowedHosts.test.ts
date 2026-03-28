import { describe, expect, it } from "vitest";
import {
  isHostnameAllowedForFetch,
  parseAllowedFetchHostsFromEnv,
} from "./allowedHosts";

describe("parseAllowedFetchHostsFromEnv", () => {
  it("parses comma-separated hosts", () => {
    expect(parseAllowedFetchHostsFromEnv("a.org, B.ORG , ")).toEqual([
      "a.org",
      "b.org",
    ]);
  });
  it("returns empty when unset", () => {
    expect(parseAllowedFetchHostsFromEnv(undefined)).toEqual([]);
  });
});

describe("isHostnameAllowedForFetch", () => {
  it("matches exact and subdomains", () => {
    const allowed = ["example.org"];
    expect(isHostnameAllowedForFetch("example.org", allowed)).toBe(true);
    expect(isHostnameAllowedForFetch("www.example.org", allowed)).toBe(true);
    expect(isHostnameAllowedForFetch("evil.com", allowed)).toBe(false);
  });
});
