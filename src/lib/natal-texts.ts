/**
 * Tumacenja natalne karte — SA SERVERA (`natal_texts`), nikad iz aplikacije
 * (pravilo 7). Aplikacija trazi samo kljuceve iz karte korisnika
 * (`lib/natal-keys.ts`).
 *
 * Paywall je u bazi (pravilo 8): besplatne redove (Sunce, Mesec i podznak u
 * znaku) salje svakom prijavljenom, ostale samo uz aktivan pristup. Red koji
 * nije stigao je zato ILI zakljucan ILI jos nenapisan — razlikuje ih ekran
 * (`isFreeNatalKey` + pravo pristupa), ne ovaj fajl.
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { kesProcitaj, kesUpisi, ucitajKes } from '@/lib/kes-na-disku';
import { usePovratakMreze } from '@/lib/mreza';
import { useAuthStore } from '@/store/auth';
import { jeziciUpita, jezikKorpusa, kesJezika, poJeziku } from '@/lib/jezik-korpusa';
import { useJezik } from '@/i18n';
import type { Jezik } from '@/i18n/jezik';

export type NatalText = { key: string; title: string; subtitle: string; body: string };

/** `null` = upit nije uspeo (mreza) — razlicito od praznog odgovora. */
export async function fetchNatalTexts(keys: string[], j: Jezik = jezikKorpusa()): Promise<Map<string, NatalText> | null> {
  const out = new Map<string, NatalText>();
  if (!isSupabaseConfigured || keys.length === 0) return out;
  const { data, error } = await supabase
    .from('natal_texts')
    .select('key, title, subtitle, body, jezik')
    .in('jezik', jeziciUpita(j))
    .in('key', keys);
  if (error || !data) return null;
  type Red = { key: string; title: string; subtitle: string | null; body: string; jezik?: string | null };
  // Prevod ako postoji, inace srpski (`lib/jezik-korpusa.ts`).
  for (const r of poJeziku(data as Red[], j, (x) => x.key)) {
    out.set(r.key, { key: r.key, title: r.title, subtitle: r.subtitle ?? '', body: r.body });
  }
  return out;
}

export function useNatalTexts(keys: string[]) {
  const [texts, setTexts] = React.useState<Map<string, NatalText>>(new Map());
  const [loading, setLoading] = React.useState(keys.length > 0);
  // Poredi se sadrzaj, ne referenca niza.
  const potpis = keys.join('|');
  // Pravo pristupa je deo kljuca na disku: zakljucani tekst sacuvan dok je
  // pretplata trajala ne prikazuje se kad pravo nestane (pravilo 8).
  const korisnik = useAuthStore((s) => s.user?.id ?? '');
  const pristup = useAuthStore((s) => (s.entitlement?.active ? 'p' : ''));
  const povratak = usePovratakMreze();
  const j = jezikKorpusa(useJezik());

  React.useEffect(() => {
    if (keys.length === 0) { setTexts(new Map()); setLoading(false); return; }
    // Disk i server u isto vreme (`kes-na-disku.ts`): disk popuni dok server ne
    // odgovori, a bez interneta ostaje on. Odgovor servera uvek ima prednost.
    const kljuc = (k: string) => `natal|${kesJezika(j)}${korisnik}|${pristup}|${k}`;
    let otkazano = false;
    let server = false;
    setTexts(new Map());
    setLoading(true);
    ucitajKes().then(() => {
      const disk = new Map<string, NatalText>();
      for (const k of keys) {
        const t = kesProcitaj<NatalText>(kljuc(k));
        if (t) disk.set(k, t);
      }
      if (otkazano || server || disk.size === 0) return;
      setTexts(disk);
      setLoading(false);
    });
    fetchNatalTexts(keys, j).then((m) => {
      if (otkazano) return;
      if (m) {
        server = true;
        setTexts(m);
        for (const [k, t] of m) kesUpisi(kljuc(k), t);
      }
      setLoading(false);
    });
    return () => { otkazano = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpis, korisnik, pristup, povratak, j]);

  return { texts, loading };
}

export type NatalNaslov = { title: string; subtitle: string; free: boolean };

/**
 * NASLOVI tumacenja za listu na ekranu "Ti" — i zakljucanih (`supabase/natal-naslovi.sql`).
 * Tekst ne dolazi. Dok funkcija nije pokrenuta na serveru, vraca praznu mapu
 * i lista ostaje bez naslova — nije greska.
 */
export function useNatalNaslovi(keys: string[]) {
  const [naslovi, setNaslovi] = React.useState<Map<string, NatalNaslov>>(new Map());
  const potpis = keys.join('|');
  const povratak = usePovratakMreze();
  const j = jezikKorpusa(useJezik());

  React.useEffect(() => {
    if (keys.length === 0 || !isSupabaseConfigured) { setNaslovi(new Map()); return; }
    // Naslovi su isti za svakog korisnika i ne zavise od prava pristupa.
    const kljuc = (k: string) => `natal-naslov|${kesJezika(j)}${k}`;
    let otkazano = false;
    let server = false;
    ucitajKes().then(() => {
      const disk = new Map<string, NatalNaslov>();
      for (const k of keys) {
        const t = kesProcitaj<NatalNaslov>(kljuc(k));
        if (t) disk.set(k, t);
      }
      if (!otkazano && !server && disk.size > 0) setNaslovi(disk);
    });
    // Sa jezikom (rezerva na srpski je u funkciji, `supabase/prevod-jezik.sql`).
    supabase.rpc('natal_naslovi', { kljucevi: keys, jez: j }).then(({ data, error }) => {
      if (otkazano || error || !data) return;
      server = true;
      const m = new Map<string, NatalNaslov>();
      for (const r of data as { key: string; title: string; subtitle: string | null; free: boolean }[]) {
        const t = { title: r.title, subtitle: r.subtitle ?? '', free: r.free };
        m.set(r.key, t);
        kesUpisi(kljuc(r.key), t);
      }
      setNaslovi(m);
    });
    return () => { otkazano = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpis, povratak, j]);

  return naslovi;
}
