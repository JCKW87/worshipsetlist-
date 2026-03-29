import { pitchClassToName } from "./keys";

const CHORD_START = /^([A-Ga-g])([#b]?)(.*)$/;

export type ParsedChord = {
  root: string;
  accidental: "" | "#" | "b";
  suffix: string;
  bass: string | null;
};

/**
 * Parse a chord symbol like "C#m7" or "F#/A#".
 */
export function parseChordSymbol(raw: string): ParsedChord | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const slashIdx = trimmed.indexOf("/");
  const main = slashIdx >= 0 ? trimmed.slice(0, slashIdx) : trimmed;
  const bassPart = slashIdx >= 0 ? trimmed.slice(slashIdx + 1) : null;

  const m = main.match(CHORD_START);
  if (!m) return null;

  const root = m[1].toUpperCase();
  const accidental = (m[2] ?? "") as "" | "#" | "b";
  const suffix = m[3] ?? "";

  let bass: string | null = null;
  if (bassPart) {
    const bm = bassPart.trim().match(CHORD_START);
    if (bm) {
      bass = bm[1].toUpperCase() + (bm[2] ?? "") + (bm[3] ?? "");
    } else {
      bass = bassPart.trim();
    }
  }

  return { root, accidental, suffix, bass };
}

function noteToPitchClass(root: string, accidental: "" | "#" | "b"): number | null {
  const natural: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const base = natural[root];
  if (base === undefined) return null;
  if (accidental === "#") return (base + 1) % 12;
  if (accidental === "b") return (base + 11) % 12;
  return base;
}

function pitchClassToChordRoot(pc: number, preferFlats: boolean): string {
  return pitchClassToName(pc, preferFlats);
}

export function transposeChordSymbol(
  symbol: string,
  semitones: number,
  preferFlats: boolean,
): string {
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return symbol;

  const mainPc = noteToPitchClass(parsed.root, parsed.accidental);
  if (mainPc === null) return symbol;

  const newMainPc = (mainPc + semitones + 120) % 12;
  const newMain =
    pitchClassToChordRoot(newMainPc, preferFlats) + parsed.suffix;

  if (!parsed.bass) return newMain;

  const bassParsed = parseChordSymbol(parsed.bass);
  if (!bassParsed) return `${newMain}/${parsed.bass}`;

  const bassPc = noteToPitchClass(bassParsed.root, bassParsed.accidental);
  if (bassPc === null) return `${newMain}/${parsed.bass}`;

  const newBassPc = (bassPc + semitones + 120) % 12;
  const newBass =
    pitchClassToChordRoot(newBassPc, preferFlats) + bassParsed.suffix;

  return `${newMain}/${newBass}`;
}
