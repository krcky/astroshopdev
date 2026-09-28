/**
 * Test karte za provere i pregled u razvoju — RACUNATE, ne upisane rucno.
 * Ne koristi se u aplikaciji za korisnike.
 */
import { buildNatalChart, type NatalChart } from '@/lib/natal';
import { oblastiDana } from '@/lib/oblasti';

export const BEOGRAD = { latitude: 44.8125, longitude: 20.4612 };

/**
 * Prvo rodjenje u Beogradu 10.7.1990. (UTC, korak od minuta) kome je
 * Ascendent u trazenom znaku, bar 5° od pocetka znaka — da granica ne odlucuje.
 */
export function kartaSaAscendentom(signKey: string): NatalChart {
  for (let m = 0; m < 24 * 60; m++) {
    const chart = buildNatalChart({ date: new Date(Date.UTC(1990, 6, 10, 0, m)), ...BEOGRAD });
    if (chart.ascendantSign.sign.key === signKey && chart.ascendantSign.degree > 5) return chart;
  }
  throw new Error(`nema Ascendenta u ${signKey} tog dana`);
}

/**
 * Pregled taba "Tranziti" i ocena oblasti (`/dev-tranziti`): prva karta (rodjenje u Beogradu,
 * 12. april, godina i sat po redu) i prvi dan od `od` kad svaka oblast ima bar
 * jedan red, a "Ostali tranziti" bar jedan pravi tranzit. Pretraga, ne upis.
 */
export function primerZaOblasti(od: Date, dana = 30): { chart: NatalChart; date: Date } | null {
  for (let godina = 1960; godina <= 2008; godina++) {
    for (let sat = 0; sat < 24; sat += 2) {
      const chart = buildNatalChart({ date: new Date(Date.UTC(godina, 3, 12, sat)), ...BEOGRAD });
      for (let o = 0; o < dana; o++) {
        const date = new Date(od.getFullYear(), od.getMonth(), od.getDate() + o, 12);
        const r = oblastiDana({ chart, date, timeUnknown: false });
        if (r.oblasti.every((a) => a.stavke.length > 0) && r.ostali.some((s) => s.red.kind === 'tranzit')) {
          return { chart, date };
        }
      }
    }
  }
  return null;
}
