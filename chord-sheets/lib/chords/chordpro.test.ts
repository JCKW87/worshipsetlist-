import { describe, expect, it } from "vitest";
import { semitoneDelta } from "./keys";
import { transposeChordProText } from "./chordpro";
import { transposeChordSymbol } from "./transposeChord";

describe("semitoneDelta", () => {
  it("moves from G to D", () => {
    expect(semitoneDelta("G", "D")).toBe(7);
  });
  it("handles Bb", () => {
    expect(semitoneDelta("F", "Bb")).toBe(5);
  });
});

describe("transposeChordSymbol", () => {
  it("transposes slash chord", () => {
    expect(transposeChordSymbol("G/B", 2, false)).toBe("A/C#");
  });
});

describe("transposeChordProText", () => {
  it("transposes bracketed chords", () => {
    const out = transposeChordProText("[G]Hello [Em]world", "G", "A");
    expect(out).toContain("[A]");
    expect(out).toContain("[F#m]");
  });
});
