/**
 * Podnaslov astrologa uz besplatno natalno tumacenje ("Kralj Zodijaka") — ekran sa velikom trojkom
 * u onboardingu (`reveal.tsx`). Podaci su GENERISANI (`natal-podnaslovi-podaci.ts`, skripta
 * `scripts/korpus/natal-podnaslovi.py`). Jezik kao i tekstovi korpusa: hr, bs i en imaju prevod, ostali
 * dobijaju srpski (`jezikKorpusa`). Cist modul, bez react-native uvoza.
 */
import { jezikKorpusa } from '@/lib/jezik-korpusa';
import { NATAL_PODNASLOVI, type TackaPodnaslova } from '@/lib/natal-podnaslovi-podaci';

export type { TackaPodnaslova };

/** Fraza astrologa za Sunce / Mesec / Ascendent u znaku; `null` kad je nema. */
export function natalPodnaslov(tacka: TackaPodnaslova, znakKey: string): string | null {
  return NATAL_PODNASLOVI[jezikKorpusa()]?.[tacka]?.[znakKey] ?? NATAL_PODNASLOVI.sr[tacka]?.[znakKey] ?? null;
}
