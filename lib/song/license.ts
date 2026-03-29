export const LICENSE_TYPES = [
  "public_domain",
  "original_or_permission",
  "cc_by",
  "paste_only_no_fetch",
] as const;

export type LicenseType = (typeof LICENSE_TYPES)[number];

export const LICENSE_LABELS: Record<LicenseType, string> = {
  public_domain: "Public domain (I have verified for my use)",
  original_or_permission: "Original / I have permission to reproduce",
  cc_by: "Creative Commons or similar (attribution required)",
  paste_only_no_fetch: "Pasted chart only",
};
