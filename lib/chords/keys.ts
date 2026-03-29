/** Pitch class 0–11 from C. */

const SHARP_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

const FLAT_NAMES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

/** Major keys that are usually notated with flats (tonic pitch class). */
const FLAT_MAJOR_TONICS = new Set<number>([5, 10, 3, 8, 1, 6]); // F, Bb, Eb, Ab, Db, Gb

function stripWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, "");
}

/**
 * Returns pitch class of the key tonic (0–11). Accepts "G", "Bb", "F#m", "Am", etc.
 */
export function keyToPitchClass(key: string): number | null {
  const k = stripWhitespace(key);
  if (!k) return null;

  const rootPart = k
    .replace(/maj7$/i, "")
    .replace(/maj$/i, "")
    .replace(/m(?:inor)?$/i, "");

  const note = parseNoteName(rootPart);
  if (note === null) return null;
  return note;
}

function parseNoteName(name: string): number | null {
  const m = name.match(/^([A-Ga-g])([#b]?)$/);
  if (!m) return null;
  const letter = m[1].toUpperCase();
  const acc = m[2] ?? "";

  const map: Record<string, number> = {
    C: 0,
    "C#": 1,
    Db: 1,
    D: 2,
    "D#": 3,
    Eb: 3,
    E: 4,
    F: 5,
    "F#": 6,
    Gb: 6,
    G: 7,
    "G#": 8,
    Ab: 8,
    A: 9,
    "A#": 10,
    Bb: 10,
    B: 11,
  };

  const full = letter + acc;
  if (map[full] !== undefined) return map[full];

  const natural = map[letter];
  if (natural === undefined) return null;
  if (acc === "#") return (natural + 1) % 12;
  if (acc === "b") return (natural + 11) % 12;
  return natural;
}

export function preferFlatsForKey(key: string): boolean {
  const pc = keyToPitchClass(key);
  if (pc === null) return false;
  return FLAT_MAJOR_TONICS.has(pc);
}

export function semitoneDelta(fromKey: string, toKey: string): number | null {
  const from = keyToPitchClass(fromKey);
  const to = keyToPitchClass(toKey);
  if (from === null || to === null) return null;
  return (to - from + 12) % 12;
}

export function pitchClassToName(pc: number, preferFlats: boolean): string {
  const i = ((pc % 12) + 12) % 12;
  return preferFlats ? FLAT_NAMES[i] : SHARP_NAMES[i];
}
