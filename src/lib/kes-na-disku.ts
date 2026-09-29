/**
 * Tekstovi koji su VEC stigli sa servera, sacuvani na telefonu — da aplikacija
 * bez interneta pokaze ono sto je korisnik vec video (Ivan, 29.9.2026).
 *
 * Ovo NIJE korpus na klijentu (pravilo 7): na disk ide samo ono sto je server
 * ovom nalogu vec poslao po RLS-u, i samo poslednjih `MAX_STAVKI`. Deo kljuca je
 * nalog i pravo pristupa, isto kao u memorijskom kesu — dugi tekst sacuvan dok je
 * pretplata trajala ne prikazuje se kad pravo nestane (pravilo 8).
 *
 * Disk je REZERVA, ne izvor: ekran i dalje trazi tekst sa servera pri svakom
 * pokretanju, a disk popunjava prazninu dok odgovor ne stigne ili kad ne stigne
 * nikad. Zato ispravka teksta u bazi stize odmah, a ne tek kad kes istekne.
 * "Nema teksta" se NE cuva na disku — tekst koji astrolog doda mora da se pojavi.
 *
 * Brise se pri odjavi i brisanju naloga (`store/auth.ts`).
 */
import * as React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KLJUC = 'tekstovi-kes-v1';
/** Starije od ovoga se odbacuje pri ucitavanju. */
const MAX_DANA = 14;
/**
 * Najvise stavki, pa najvise ZNAKOVA. Android AsyncStorage cita jedan red kroz
 * prozor od 2 MB, a tekst drzi sa 2 bajta po znaku — zato 700 000 znakova
 * (~1,4 MB), ne 2 miliona. Duga verzija tranzita ima do ~6 000 znakova.
 */
const MAX_STAVKI = 300;
const MAX_ZNAKOVA = 700_000;

type Zapis = { v: unknown; t: number };

let stavke = new Map<string, Zapis>();
let ucitano = false;
const slusaoci = new Set<() => void>();
const javi = () => slusaoci.forEach((f) => f());

let ucitavanje: Promise<void> | null = null;

/** Ucitava kes jednom; kasniji pozivi cekaju isto ucitavanje. */
export function ucitajKes(): Promise<void> {
  if (!ucitavanje) {
    ucitavanje = (async () => {
      try {
        const sirovo = await AsyncStorage.getItem(KLJUC);
        const granica = Date.now() - MAX_DANA * 86_400_000;
        const zapisi: [string, Zapis][] = sirovo ? JSON.parse(sirovo) : [];
        // Upis iz ove sesije koji je stigao pre ucitavanja ima prednost.
        const sveze = stavke;
        stavke = new Map(zapisi.filter(([, z]) => z.t >= granica));
        for (const [k, z] of sveze) stavke.set(k, z);
      } catch {
        // Ostecen ili necitljiv kes: pocinje se od praznog, tekstovi stizu sa servera.
      }
      ucitano = true;
      javi();
    })();
  }
  return ucitavanje;
}

let tajmer: ReturnType<typeof setTimeout> | null = null;
function zakaziUpis() {
  if (tajmer) clearTimeout(tajmer);
  tajmer = setTimeout(async () => {
    tajmer = null;
    // Najnovije prvo; odseca se po broju, pa po velicini.
    let niz = [...stavke].sort((a, b) => b[1].t - a[1].t).slice(0, MAX_STAVKI);
    let json = JSON.stringify(niz);
    while (json.length > MAX_ZNAKOVA && niz.length > 0) {
      niz = niz.slice(0, Math.floor(niz.length * 0.8));
      json = JSON.stringify(niz);
    }
    stavke = new Map(niz);
    try { await AsyncStorage.setItem(KLJUC, json); } catch { /* disk pun: ostaje u memoriji */ }
  }, 500);
}

export function kesProcitaj<T>(k: string): T | undefined {
  return stavke.get(k)?.v as T | undefined;
}

export function kesUpisi(k: string, v: unknown) {
  stavke.set(k, { v, t: Date.now() });
  zakaziUpis();
}

export async function obrisiKes() {
  if (tajmer) { clearTimeout(tajmer); tajmer = null; }
  stavke = new Map();
  javi();
  try { await AsyncStorage.removeItem(KLJUC); } catch { /* nista */ }
}

/** Da li je kes procitan sa diska — ekran se ponovo racuna kad stigne. */
export function useKesUcitan(): boolean {
  React.useEffect(() => { ucitajKes(); }, []);
  return React.useSyncExternalStore(
    (f) => { slusaoci.add(f); return () => slusaoci.delete(f); },
    () => ucitano,
    () => ucitano,
  );
}
