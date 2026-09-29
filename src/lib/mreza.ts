/**
 * Da li telefon ima internet — za traku "Nema interneta" i za ponovni upit
 * tekstova kad se mreza vrati (Ivan, 29.9.2026).
 *
 * BEZ NATIVNOG MODULA. `expo-network` Expo Go NEMA ("Cannot find native module
 * 'ExpoNetwork'" na Androidu, 29.9.2026) — a dev build jos ne postoji. Zato se
 * stanje zakljucuje iz stvarnih zahteva: svaki upit ka Supabase-u prolazi kroz
 * `pratiFetch` (`lib/supabase.ts`) i javlja da li je stigao do servera. Dok veze
 * nema, na svakih `PROVERA_MS` ide jedna mala provera, pa traka nestane i kad
 * korisnik nista ne dira. Kad se aplikacija vrati iz pozadine, provera ide odmah.
 *
 * Sve sto se ovde zna je "server je odgovorio / nije". To je i jedino sto
 * aplikaciju zanima: Wi-Fi bez interneta za nju je isto sto i bez mreze.
 *
 * Na pocetku se smatra da mreza POSTOJI: traka koja bljesne na svakom
 * pokretanju bila bi gora od trake koja kasni do prvog upita.
 */
import * as React from 'react';
import { AppState } from 'react-native';

const URL_SERVERA = process.env.EXPO_PUBLIC_SUPABASE_URL;
const KLJUC = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
/** Koliko cesto se proverava dok veze nema. */
const PROVERA_MS = 15_000;
/** Posle ovoliko je provera neuspela. Izdasno — spor mobilni internet nije "bez interneta". */
const ROK_MS = 10_000;

let naMrezi = true;
/** Koliko puta se mreza VRATILA — zavisnost za upite koji su pali bez nje. */
let povratci = 0;
const slusaoci = new Set<() => void>();

let tajmer: ReturnType<typeof setTimeout> | null = null;

function postavi(v: boolean) {
  if (v === naMrezi) return;
  naMrezi = v;
  if (v) povratci++;
  slusaoci.forEach((f) => f());
  zakaziProveru();
}

function zakaziProveru() {
  if (tajmer) { clearTimeout(tajmer); tajmer = null; }
  if (!naMrezi) tajmer = setTimeout(proveri, PROVERA_MS);
}

/**
 * Jedan mali zahtev ka serveru. Bilo kakav HTTP odgovor znaci da veza postoji.
 * JEDINO ova provera sme da proglasi "nema interneta" — pad obicnog upita je
 * samo povod da se ona pokrene (vidi `pratiFetch`).
 */
let proveraTece: Promise<void> | null = null;
function proveri(): Promise<void> {
  if (!proveraTece) proveraTece = jednaProvera().finally(() => { proveraTece = null; });
  return proveraTece;
}

async function jednaProvera() {
  if (!URL_SERVERA || !KLJUC) return;
  const prekid = new AbortController();
  const rok = setTimeout(() => prekid.abort(), ROK_MS);
  try {
    await fetch(`${URL_SERVERA}/auth/v1/health`, { headers: { apikey: KLJUC }, signal: prekid.signal });
    postavi(true);
  } catch (e) {
    if (__DEV__) console.log('[mreza] provera pala:', (e as Error)?.name, (e as Error)?.message);
    postavi(false);
    zakaziProveru();
  } finally {
    clearTimeout(rok);
  }
}

/**
 * `fetch` za Supabase klijent: isti poziv, samo javlja ishod. Svaki HTTP
 * odgovor, i 4xx/5xx, znaci da veza postoji. Kad upit PADNE, to jos ne znaci
 * da veze nema (Ivan, 29.9.2026: traka se pojavila uz ziv internet) — zato
 * pad samo pokrene `proveri()`, a ona odlucuje.
 */
export const pratiFetch: typeof fetch = async (...args) => {
  try {
    const odgovor = await fetch(...args);
    postavi(true);
    return odgovor;
  } catch (e) {
    if (__DEV__) console.log('[mreza] upit pao, proveravam vezu:', String(args[0]).slice(0, 100), (e as Error)?.message);
    proveri();
    throw e;
  }
};

let pokrenuto = false;
function pokreni() {
  if (pokrenuto) return;
  pokrenuto = true;
  AppState.addEventListener('change', (s) => { if (s === 'active') proveri(); });
}

function useStanje<T>(uzmi: () => T): T {
  pokreni();
  return React.useSyncExternalStore(
    (f) => { slusaoci.add(f); return () => slusaoci.delete(f); },
    uzmi,
    uzmi,
  );
}

export function useNaMrezi(): boolean {
  return useStanje(() => naMrezi);
}

/**
 * Broj povrataka mreze. Ide u zavisnosti upita: kad se veza vrati, upit ide
 * ponovo — a kad veza PADNE, ne ide (ponavljanje bi samo ispraznilo ekran).
 */
export function usePovratakMreze(): number {
  return useStanje(() => povratci);
}
