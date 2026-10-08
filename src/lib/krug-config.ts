/**
 * KRUG ZIVOTA — osam oblasti, sve sto astrolog sme da menja, na jednom mestu (Ivan, 8.10.2026).
 *
 * Racun je u `lib/krug.ts`. Oblast je ISTI model kao `OBLASTI` u `oblasti-config.ts` (kuce
 * sa punom i slabom vezom + planete oblasti), samo ih ima osam i pokrivaju svih 12 kuca.
 * `OBLASTI` (cetiri) ostaje za pricu i karticu za deljenje, koje se ne menjaju.
 *
 * SVE JE PREDLOG KOJI CEKA POTVRDU ASTROLOGA: koja kuca i koje planete nosi koja oblast
 * (simulacija na 24 karte za godinu dana: 56—73% dana oblast nije neutralna uz kuce i
 * planete, a samo uz kuce Porodica, Partner i Zabava stoje na 3 vise od 60% dana, i bez
 * vremena rodjenja ostanu na 3 cele godine — planete drze oblast zivom).
 * Opis za astrologa: `docs/ASTRO-LOGIKA.md`, poglavlje 12.
 */
import type { OblastDef } from '@/lib/oblasti-config';

export type KrugKey =
  | 'karijera' | 'finansije' | 'zdravlje' | 'porodica'
  | 'partner' | 'licni_razvoj' | 'zabava' | 'prijateljstvo';

export type KrugDef = Pick<OblastDef, 'houses' | 'weakHouses' | 'points'> & { key: KrugKey };

/**
 * Redosled je i redosled na krugu: od vrha u smeru kazaljke (Karijera gore, Partner dole,
 * Zdravlje desno, Zabava levo). Prva dva sa liste `BESPLATNO.krug` su Partner i Zdravlje.
 */
export const KRUG: readonly KrugDef[] = [
  { key: 'karijera', houses: [10], weakHouses: [6], points: ['saturn', 'jupiter', 'midheaven'] },
  { key: 'finansije', houses: [2], weakHouses: [8], points: ['venus', 'jupiter'] },
  { key: 'zdravlje', houses: [1, 6], weakHouses: [], points: ['sun', 'mars', 'ascendant'] },
  { key: 'porodica', houses: [4], weakHouses: [], points: ['moon', 'saturn'] },
  { key: 'partner', houses: [7], weakHouses: [], points: ['venus', 'moon', 'mars'] },
  { key: 'licni_razvoj', houses: [9, 12], weakHouses: [], points: ['jupiter', 'neptune'] },
  { key: 'zabava', houses: [5], weakHouses: [], points: ['venus', 'sun'] },
  { key: 'prijateljstvo', houses: [3, 11], weakHouses: [], points: ['mercury', 'uranus'] },
];

/** Stanje oblasti, po oceni 1—5 (indeks = ocena − 1). Reci su u recniku: `krug.stanja`. */
export const STANJA = ['pritisak', 'oprez', 'mirno', 'raste', 'procvat'] as const;
export type StanjeKey = (typeof STANJA)[number];

/**
 * Stanje se racuna iz PROSEKA ocene za `PROZOR` dana oko tekuceg (jedan pre, tekuci, jedan
 * posle), ne iz ocene samog dana: dnevna ocena se menja svaka 3 dana, pa bi stanje
 * skakalo ("Mirno, Oprez, Mirno"). Sa prozorom od 3 dana se menja oko jednom u 4 dana,
 * a bar jedna od osam oblasti u 79% dana. TACKICE su uvek dnevna ocena, bez ublazavanja.
 */
export const PROZOR = 3;
