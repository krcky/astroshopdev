/**
 * Boje dnevne price — sve iz postojecih boja aplikacije, nista novo:
 * indigo iz loga, lila ikonica oblasti, "svetlo plava" i "roze" iz "Ide ti / Koči te".
 */
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { MINUS_BOJA, PLUS_BOJA } from '@/components/ton';
import { brand, neutral } from '@/theme/tokens';
import type { Tone } from '@/lib/tone';

export const INDIGO = brand.indigo;
export const LILA = OBLAST_BOJA;
export const PLUS = PLUS_BOJA;
export const MINUS = MINUS_BOJA;
export const INK = neutral.ink;
export const SIVA = neutral.grouped;
/** Prsten ulaza u pricu: svetla ljubicasta -> indigo (Ivan, 30.9.2026). */
export const PRSTEN_PRELIV = ['#D6C8F7', '#A48FD8', brand.indigo] as const;

/** Ton u svetlim bojama (trake na naslovnoj, legenda). */
export const TON_BOJA: Record<Tone, string> = { povoljno: PLUS, mesovito: LILA, izazovno: MINUS };
/**
 * Ton u dubljim nijansama istih boja — linije na tocku i tekst "↑ bolje nego juče":
 * svetle bi se na indigu i na beloj kartici utopile.
 */
export const TON_MASTILO: Record<Tone, string> = { povoljno: '#3FA9D6', mesovito: '#9B85CC', izazovno: '#E97F9A' };

/** Nijanse zivog preliva po slici: boja i jacina u sredini svake mrlje. */
export type Nijansa = 'noc' | 'indigo' | 'zlato';
export const NIJANSE: Record<Nijansa, readonly (readonly [string, number])[]> = {
  /** Na indigu: lila, plavoljubicasta, svetlo plava — svetle mrlje u tamnoj boji. */
  noc: [['rgb(179, 157, 219)', 0.42], ['rgb(99, 102, 220)', 0.36], ['rgb(122, 204, 234)', 0.22]],
  /** Na sivoj: ista porodica kao `backdrop.tints.indigo` i `purple`. */
  indigo: [['rgb(99, 102, 180)', 0.42], ['rgb(125, 83, 230)', 0.36], ['rgb(64, 63, 152)', 0.22]],
  /** Na sivoj: `backdrop.tints.gold`. */
  zlato: [['rgb(244, 200, 68)', 0.42], ['rgb(245, 158, 11)', 0.36], ['rgb(244, 200, 68)', 0.22]],
};
