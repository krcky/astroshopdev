/**
 * Test karte za provere i pregled u razvoju — RACUNATE, ne upisane rucno.
 * Ne koristi se u aplikaciji za korisnike.
 */
import { buildNatalChart, type NatalChart } from '@/lib/natal';

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
