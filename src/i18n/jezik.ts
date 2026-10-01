/**
 * Jezik aplikacije — JEDINO mesto koje zna koji je jezik izabran i daje recnik.
 *
 * Tekst za korisnika se NE pise u ekranu nego u recniku (`src/i18n/sr/`), a cita se:
 *   - u komponenti kroz `useT()` (`./use-t.ts`) — ekran se iscrta iznova kad se jezik promeni,
 *   - van komponente (`lib/`, store) kroz `tr()` U TRENUTKU POZIVA.
 * Prevedeni tekst se NIKAD ne pamti u konstanti na nivou modula: modul se izvrsi jednom,
 * pre nego sto se jezik postavi, i ostao bi na jeziku sa kojim je ucitan. Podatak koji nosi
 * ime (znak, planeta) ima GETTER (`get name()`), pa pozivaoci citaju `sign.name` kao i ranije.
 *
 * Srpski je OSNOVA: svaki drugi recnik je dopuna (`Delimicno<Recnik>`), a sto u njemu fali
 * uzima se iz srpskog. Cist modul, bez RN uvoza (pravilo 6) — `tr()` radi i u proverama.
 * Provera: `npm run check:prevod`.
 */
import { bs } from './bs';
import { en } from './en';
import { hr } from './hr';
import { sr, type Recnik } from './sr';

export type { Recnik };

/** Jezici koje aplikacija planira. Recnik postoji samo za one u `recnici`. */
export type Jezik = 'sr' | 'hr' | 'bs' | 'sl' | 'mk' | 'en';
export const JEZICI: readonly Jezik[] = ['sr', 'hr', 'bs', 'sl', 'mk', 'en'];

/** Dopuna recnika: svaka grana i list su neobavezni, funkcije se menjaju cele. */
export type Delimicno<T> = T extends (...a: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { [K in keyof T]?: Delimicno<T[K]> }
      : T;

const recnici: Partial<Record<Jezik, Recnik>> = { sr, hr, bs, en };

/** Ime jezika NA TOM JEZIKU — za izbor u profilu (ne prevodi se). */
export const IME_JEZIKA: Record<Jezik, string> = {
  sr: 'Srpski', hr: 'Hrvatski', bs: 'Bosanski', sl: 'Slovenščina', mk: 'Македонски', en: 'English',
};

/** Jezici za koje recnik postoji, redom za izbor. */
export const dostupniJezici = (): Jezik[] => JEZICI.filter((j) => recnici[j] !== undefined);

/** Spaja dopunu preko osnove; nizovi i funkcije se menjaju celi, objekti grana po grana. */
export function spoji<T>(osnova: T, dopuna: Delimicno<T> | undefined): T {
  if (dopuna === undefined) return osnova;
  if (typeof osnova !== 'object' || osnova === null || Array.isArray(osnova)) return dopuna as unknown as T;
  const out: Record<string, unknown> = { ...(osnova as Record<string, unknown>) };
  for (const [k, v] of Object.entries(dopuna as Record<string, unknown>)) {
    if (v !== undefined) out[k] = spoji((osnova as Record<string, unknown>)[k], v as never);
  }
  return out as T;
}

/** Dodaje recnik jezika kao dopunu srpskog. */
export function registrujJezik(j: Jezik, dopuna: Delimicno<Recnik>): void {
  recnici[j] = spoji<Recnik>(sr, dopuna);
}

let tekuci: Jezik = 'sr';
const slusaoci = new Set<() => void>();

export const jezik = (): Jezik => tekuci;

/** Da li za jezik postoji recnik (bez njega se vidi srpski). */
export const imaRecnik = (j: Jezik): boolean => recnici[j] !== undefined;

export function postaviJezik(j: Jezik): void {
  if (j === tekuci) return;
  tekuci = j;
  slusaoci.forEach((f) => f());
}

export function pretplati(f: () => void): () => void {
  slusaoci.add(f);
  return () => slusaoci.delete(f);
}

/** Recnik tekuceg jezika. Van komponente; u komponenti `useT()`. */
export function tr(): Recnik {
  return recnici[tekuci] ?? sr;
}
