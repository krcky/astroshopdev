/**
 * Mesecni lunarni kalendar na ekranu Mesec (Ivan, 29.9.2026): mreza meseca
 * (nedelja pocinje ponedeljkom), glavne faze po danima i pomeranje dana.
 *
 * Cist racun, bez RN uvoza (pravilo 6). Provera: `npm run check:lunarni-kalendar`.
 */
import * as Astronomy from 'astronomy-engine';

import { MAIN_PHASES } from '@/lib/moon';
import { dayKey } from '@/lib/transits';

export const MESECI_PUNO = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

/** Zaglavlje kolona, ponedeljak prvi. */
export const DANI_U_NEDELJI = ['P', 'U', 'S', 'Č', 'P', 'S', 'N'];

/**
 * Nedelje meseca: svaka je 7 celija, `null` = dan iz susednog meseca (prazno).
 * Dan je LOKALNO PODNE — daleko od ponoci, pa ga ni promena sata ne pomeri u
 * drugi dan, a oblik Meseca je "sredina dana".
 */
export function mrezaMeseca(godina: number, mesec: number): (Date | null)[][] {
  const prvi = new Date(godina, mesec, 1, 12);
  const brojDana = new Date(godina, mesec + 1, 0).getDate();
  // getDay: 0 = nedelja. Ponedeljak prvi: pon -> 0, ned -> 6.
  const pomeraj = (prvi.getDay() + 6) % 7;
  const celije: (Date | null)[] = Array.from({ length: pomeraj }, () => null);
  for (let d = 1; d <= brojDana; d++) celije.push(new Date(godina, mesec, d, 12));
  while (celije.length % 7) celije.push(null);
  const nedelje: (Date | null)[][] = [];
  for (let i = 0; i < celije.length; i += 7) nedelje.push(celije.slice(i, i + 7));
  return nedelje;
}

export type GlavnaFaza = (typeof MAIN_PHASES)[number]['key'];

/** Dani meseca na koje pada glavna faza: `dayKey` -> faza (i tacan trenutak). */
export function glavneFazeMeseca(godina: number, mesec: number): Map<string, { key: GlavnaFaza; at: Date }> {
  const od = new Date(godina, mesec, 1);
  const doo = new Date(godina, mesec + 1, 1);
  const out = new Map<string, { key: GlavnaFaza; at: Date }>();
  for (const p of MAIN_PHASES) {
    let t = od;
    for (;;) {
      const hit = Astronomy.SearchMoonPhase(p.angle, t, 40);
      if (!hit || hit.date >= doo) break;
      out.set(dayKey(hit.date), { key: p.key, at: hit.date });
      t = new Date(hit.date.getTime() + 86_400_000);
    }
  }
  return out;
}

/**
 * Nedelja (ponedeljak—nedelja) u kojoj je `dan`, kao sedam lokalnih podneva —
 * sklopljen kalendar. Moze da prelazi u susedni mesec.
 */
export function nedeljaDana(dan: Date): Date[] {
  const pomeraj = (dan.getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => new Date(dan.getFullYear(), dan.getMonth(), dan.getDate() - pomeraj + i, 12));
}

/** Ugao faze (0—360) u lokalno podne tog dana — za crtez u celiji kalendara. */
export function ugaoDana(dan: Date): number {
  return Astronomy.MoonPhase(new Date(dan.getFullYear(), dan.getMonth(), dan.getDate(), 12));
}

/**
 * Isti sat i minut, `n` kalendarskih dana dalje (preko kalendara, ne +24h —
 * dan promene sata ima 23 ili 25 sati).
 */
export function pomeriDan(date: Date, n: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n, date.getHours(), date.getMinutes());
}

/** Izabran dan iz kalendara, sa satom i minutom trenutka `sat` (da procenat za danas bude "sada"). */
export function naDan(dan: Date, sat: Date): Date {
  return new Date(dan.getFullYear(), dan.getMonth(), dan.getDate(), sat.getHours(), sat.getMinutes());
}

export function istiDan(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}
