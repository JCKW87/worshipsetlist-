import { preferFlatsForKey, semitoneDelta } from "./keys";
import { transposeChordSymbol } from "./transposeChord";

/**
 * Transpose bracketed ChordPro chords, e.g. [C] [F#m7] [Bb/D].
 * Directives with colon inside brackets are left unchanged.
 */
export function transposeChordProText(
  text: string,
  fromKey: string,
  toKey: string,
): string {
  const from = fromKey.trim();
  const to = toKey.trim();
  if (!from || !to) return text;

  const delta = semitoneDelta(from, to);
  if (delta === null || delta === 0) return text;

  const useFlats = preferFlatsForKey(to);

  return text.replace(/\[([^\]\n]+)\]/g, (match, inner: string) => {
    const chord = inner.trim();
    if (!chord || chord.startsWith("{")) return match;
    if (/:/.test(chord)) return match;
    const transposed = transposeChordSymbol(chord, delta, useFlats);
    return `[${transposed}]`;
  });
}
