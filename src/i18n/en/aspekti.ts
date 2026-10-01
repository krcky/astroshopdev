/**
 * Aspect as a VERB, for sentences: "Venus trines your Sun", "Mars squares your Moon".
 * English-only helper (Serbian builds the same sentence with cases: "je u trigonu sa tvojim Suncem").
 * Conjunction stays "is conjunct" — "conjoins" reads stiff.
 */
export const ASPEKT_GLAGOL: Record<'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition', string> = {
  conjunction: 'is conjunct',
  sextile: 'sextiles',
  square: 'squares',
  trine: 'trines',
  opposition: 'opposes',
};
