/**
 * KRUG ZIVOTA — osam oblasti sa stanjem i danasnjom jacinom (Ivan, 8.10.2026).
 *
 * Isti racun kao ocene oblasti (`lib/oblasti.ts`): aktivni tranziti dana -> veza sa oblascu
 * (kuca ili planeta) -> ocena 1—5. Razlike:
 *   - oblasti ima osam (`KRUG`), a pricu i karticu za deljenje i dalje drzi `OBLASTI` (cetiri);
 *   - uz DANASNJU OCENU (tackice, bez ublazavanja) oblast ima STANJE: ocena se usrednji za tri
 *     dana (jedan pre, tekuci, jedan posle), pa se stanje ne menja iz dana u dan.
 *
 * Cisto, bez RN uvoza (pravilo 6). Provere: `npm run check:krug`. Opis za astrologa:
 * `docs/ASTRO-LOGIKA.md`, poglavlje 12.
 */
import type { NatalChart } from '@/lib/natal';
import {
  aktivniTranziti, lunacijaDana, ocenaIzDoprinosa, vezaSaOblascu,
  type LunacijaRed, type Red, type TranzitRed,
} from '@/lib/oblasti';
import { DOPRINOS_FAKTOR, LUNACIJA, OCENA_MAX, OCENA_MIN, OCENA_SREDINA, ZNAK_TONA } from '@/lib/oblasti-config';
import { STANJA, KRUG, type StanjeKey, type KrugDef, type KrugKey } from '@/lib/krug-config';
import { transitTone, type Tone } from '@/lib/tone';

/** Tranziti jednog dana — ulaz za ocenu oblasti. */
export type OsnovaDana = { tranziti: TranzitRed[]; lunacija: LunacijaRed | null };

export type KrugStavka = { red: Red; ton: Tone; veza: number; doprinos: number };

export type KrugOblast = {
  def: KrugDef;
  /** Danasnja jacina 1—5 (tackice). */
  ocena: number;
  /** Stanje iz proseka tri dana. */
  stanje: StanjeKey;
  /** Tranziti vezani za oblast, po uticaju na ocenu (najjaci prvi). */
  stavke: KrugStavka[];
};

export type KrugDana = { oblasti: KrugOblast[]; bezKuca: boolean };

/** Dan pomeren za `pomak` dana — lokalni datum, bez zavisnosti od sata. */
export function danPomeren(date: Date, pomak: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + pomak, 12);
}

/** Tranziti i Mlad/Pun Mesec jednog dana — osnova za ocene. */
export function osnovaDana(chart: NatalChart, date: Date, timeUnknown: boolean): OsnovaDana {
  return {
    tranziti: aktivniTranziti(chart, date, timeUnknown),
    lunacija: lunacijaDana(chart, date, timeUnknown),
  };
}

function tonReda(red: Red, tonovi: Map<string, string>): Tone {
  if (red.kind === 'lunacija') return LUNACIJA[red.faza].ton;
  return transitTone(red.transiting.key, red.aspect.key, red.natal.key, tonovi.get(red.key)).tone;
}

/** Ocena i stavke jedne oblasti za jedan dan. */
export function ocenaOblasti(
  def: KrugDef, osnova: OsnovaDana, tonovi: Map<string, string>,
): { ocena: number; stavke: KrugStavka[] } {
  const redovi: Red[] = osnova.lunacija ? [...osnova.tranziti, osnova.lunacija] : osnova.tranziti;
  const stavke: KrugStavka[] = [];
  for (const red of redovi) {
    const veza = vezaSaOblascu(red, def);
    if (veza <= 0) continue;
    const ton = tonReda(red, tonovi);
    stavke.push({ red, ton, veza, doprinos: ZNAK_TONA[ton] * red.jacina * veza * DOPRINOS_FAKTOR });
  }
  // Po uticaju na ocenu; mesoviti (doprinos 0) po jacini veze, na kraju — kao `rasporedi`.
  stavke.sort((a, b) => Math.abs(b.doprinos) - Math.abs(a.doprinos) || b.red.jacina * b.veza - a.red.jacina * a.veza);
  return { ocena: ocenaIzDoprinosa(stavke.map((s) => s.doprinos)), stavke };
}

/** Prosek ocena, zaokruzen SIMETRICNO oko 3 (kao `ocenaIzDoprinosa`): 2,5 i 3,5 se ne razilaze. */
export function usrednji(ocene: number[]): number {
  const prosek = ocene.reduce((s, x) => s + x, 0) / ocene.length;
  const pomak = Math.sign(prosek - OCENA_SREDINA) * Math.round(Math.abs(prosek - OCENA_SREDINA) + 1e-9);
  return Math.min(OCENA_MAX, Math.max(OCENA_MIN, OCENA_SREDINA + pomak));
}

export const stanjeIzOcene = (ocena: number): StanjeKey => STANJA[Math.min(OCENA_MAX, Math.max(OCENA_MIN, ocena)) - 1];

/**
 * Krug za dan: `osnove` su [juce, danas, sutra] — stanje je prosek njihovih ocena, a tackice i
 * stavke su DANASNJE. Dan koji nedostaje (nema osnove) se preskace.
 */
export function krugDana(osnove: { jucer: OsnovaDana | null; danas: OsnovaDana; sutra: OsnovaDana | null }, tonovi: Map<string, string>, bezKuca: boolean): KrugDana {
  const oblasti = KRUG.map((def): KrugOblast => {
    const danas = ocenaOblasti(def, osnove.danas, tonovi);
    const ocene = [osnove.jucer, osnove.danas, osnove.sutra]
      .filter((o): o is OsnovaDana => !!o)
      .map((o) => (o === osnove.danas ? danas.ocena : ocenaOblasti(def, o, tonovi).ocena));
    return { def, ocena: danas.ocena, stanje: stanjeIzOcene(usrednji(ocene)), stavke: danas.stavke };
  });
  return { oblasti, bezKuca };
}

/** Ocene jedne oblasti za narednih `n` dana (od `date`) — stubici "Narednih 7 dana". */
export function ocenePoDanima(
  def: KrugDef, chart: NatalChart, date: Date, timeUnknown: boolean, tonovi: Map<string, string>, n = 7,
): number[] {
  return Array.from({ length: n }, (_, i) => ocenaOblasti(def, osnovaDana(chart, danPomeren(date, i), timeUnknown), tonovi).ocena);
}

export const oblastPoKljucu = (k: KrugKey): KrugDef => KRUG.find((d) => d.key === k)!;
