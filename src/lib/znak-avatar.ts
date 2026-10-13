/**
 * Avatar profila (Ivan, 13.10.2026): znak Sunca u krugu boje elementa, a dole desno
 * mali beo krug sa indigo znakom podznaka (Ascendenta). Ovo je CIST RACUN geometrije;
 * crta ga `components/profil-avatar.tsx`, a drzi ga `npm run check:avatar`.
 *
 * Ivanove ikonice znakova (`znak-oblici.ts`) imaju znak na SREDINI KRUGA samo okvirno:
 * Lav, Skorpija i Bik su mereni po putanji pomereni za nekoliko jedinica. Na 30 pt to se
 * vidi, pa se ovde znak centrira po STVARNIM granicama putanje (ne po crtezu u fajlu) i
 * dovodi na istu velicinu — najduza strana znaka je isti deo precnika kruga za svih 12.
 */
import { ZNAK_CENTAR, ZNAK_OBLIK } from '@/lib/znak-oblici';

export type Granice = { minX: number; minY: number; maxX: number; maxY: number };

/** Koliko tacaka se uzima po krivoj; granica odstupa manje od 0,01 jedinice od prave. */
const KORAKA = 48;

/**
 * Granice putanje ikonice. Fajlovi koriste samo apsolutne M, L, H, V, C i Z — svaka druga
 * naredba je greska u podacima i baca izuzetak, da se ne dobije tiho pogresno centriranje.
 */
export function granicePutanje(d: string): Granice {
  const tok = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0;
  let x = 0;
  let y = 0;
  let px = 0;
  let py = 0;
  let naredba = '';
  const g: Granice = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  const tacka = (a: number, b: number) => {
    if (a < g.minX) g.minX = a;
    if (a > g.maxX) g.maxX = a;
    if (b < g.minY) g.minY = b;
    if (b > g.maxY) g.maxY = b;
  };
  const broj = () => Number(tok[i++]);
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) naredba = tok[i++];
    switch (naredba) {
      case 'M':
        x = broj(); y = broj(); px = x; py = y; tacka(x, y); naredba = 'L'; break;
      case 'L':
        x = broj(); y = broj(); tacka(x, y); break;
      case 'H':
        x = broj(); tacka(x, y); break;
      case 'V':
        y = broj(); tacka(x, y); break;
      case 'C': {
        const x1 = broj(); const y1 = broj(); const x2 = broj(); const y2 = broj(); const x3 = broj(); const y3 = broj();
        for (let k = 1; k <= KORAKA; k++) {
          const t = k / KORAKA;
          const u = 1 - t;
          tacka(
            u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
            u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
          );
        }
        x = x3; y = y3;
        break;
      }
      case 'Z':
        x = px; y = py; break;
      default:
        throw new Error(`Putanja znaka ima naredbu "${naredba}" koju racun ne podrzava`);
    }
  }
  return g;
}

export type ZnakAvatar = {
  /** Sredina znaka po stvarnim granicama putanje, u jedinicama ikonice. */
  cx: number;
  cy: number;
  /** Najduza strana znaka, u jedinicama ikonice. */
  duzina: number;
};

const kes = new Map<string, ZnakAvatar>();

/** Sredina i velicina znaka (`SIGNS[].key`), racuna se jednom. */
export function znakAvatar(znak: string): ZnakAvatar {
  const nadjen = kes.get(znak);
  if (nadjen) return nadjen;
  const o = ZNAK_OBLIK[znak];
  if (!o) throw new Error(`Nepoznat znak "${znak}"`);
  const g = granicePutanje(o.d);
  const r = {
    cx: (g.minX + g.maxX) / 2,
    cy: (g.minY + g.maxY) / 2,
    duzina: Math.max(g.maxX - g.minX, g.maxY - g.minY),
  };
  kes.set(znak, r);
  return r;
}

/** Najduza strana znaka kao deo precnika kruga: veliki krug (Sunce) i mali beli (podznak). */
export const ZNAK_U_KRUGU = 0.5;
export const PODZNAK_U_KRUGU = 0.58;
/** Precnik velikog kruga i malog kruga kao deo strane avatara. */
export const KRUG_SUNCA = 0.88;
export const KRUG_PODZNAKA = 0.42;
/** Razmak malog kruga od ivice kvadrata, deo strane: obrub i zaglađivanje ivice se inace odsecaju. */
export const UVLACENJE_PODZNAKA = 0.03;

export type Krug = { cx: number; cy: number; r: number };

/** Mesto i velicina znaka u krugu: sredina znaka u sredinu kruga, uz meru `razmera` jedinica po jedinici ikonice. */
export type Postavka = { translateX: number; translateY: number; razmera: number };

/** Znak u krugu `krug`: `translate(tx ty) scale(r) translate(-cx -cy)` — znak ide oko svoje sredine. */
export function postavkaZnaka(znak: string, krug: Krug, udeo: number): Postavka {
  const z = znakAvatar(znak);
  return { translateX: krug.cx, translateY: krug.cy, razmera: (krug.r * 2 * udeo) / z.duzina };
}

export type Avatar = {
  sunce: Krug;
  podznak: Krug;
};

/**
 * Raspored u kvadratu strane `s`: veliki krug tacno u sredini, mali beli u donjem desnom
 * uglu (uz samu ivicu, ali unutar kvadrata — nativna stavka trake isece sve van svog okvira).
 */
export function rasporedAvatara(s: number): Avatar {
  const R = (s * KRUG_SUNCA) / 2;
  const r = (s * KRUG_PODZNAKA) / 2;
  const kraj = s - r - s * UVLACENJE_PODZNAKA;
  return {
    sunce: { cx: s / 2, cy: s / 2, r: R },
    podznak: { cx: kraj, cy: kraj, r },
  };
}
