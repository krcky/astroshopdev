/**
 * Tumacenja tranzita — dolaze SA SERVERA, nikad iz aplikacije.
 *
 * Korpus je najvrednija imovina projekta. Da je ugradjen u bundle, svako ko
 * raspakuje .ipa izvukao bi ceo rad astrologa. Zato aplikacija trazi samo
 * tekstove za danasnje tranzite.
 *
 * Paywall je u bazi, ne ovde. RLS politika salje kratku verziju svakom
 * prijavljenom, a dugu samo onome ko ima aktivan pristup. Ako korisnik bez
 * pretplate zatrazi dugu verziju, server jednostavno ne vrati nista —
 * izmena aplikacije to ne moze da zaobidje.
 */
import * as React from 'react';

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore, usePremium } from '@/store/auth';
import { kesProcitaj, kesUpisi, ucitajKes, useKesUcitan } from '@/lib/kes-na-disku';
import { usePovratakMreze } from '@/lib/mreza';

export type TransitVersion = 'short' | 'long';

export type TransitSection = { heading: string; body: string };

export type TransitText = {
  key: string;
  version: TransitVersion;
  title: string;
  body: string;
  positive: string;
  challenge: string;
  advice: string;
  sections: TransitSection[];
};

type Row = {
  key: string;
  version: TransitVersion;
  title: string | null;
  body: string | null;
  positive: string | null;
  challenge: string | null;
  advice: string | null;
  sections: string | null;
};

function toText(r: Row): TransitText {
  let sections: TransitSection[] = [];
  if (r.sections) {
    // Cuva se kao JSON tekst, ne jsonb — uvoz iz CSV-a je tako pouzdaniji.
    try { sections = JSON.parse(r.sections); } catch { sections = []; }
  }
  return {
    key: r.key,
    version: r.version,
    title: r.title ?? '',
    body: r.body ?? '',
    positive: r.positive ?? '',
    challenge: r.challenge ?? '',
    advice: r.advice ?? '',
    sections,
  };
}

/**
 * Jedan upit za sve danasnje tranzite, ne jedan po tranzitu. `null` = upit nije
 * uspeo (mreza) — razlicito od prazne mape, jer se "nema teksta" pamti, a pad ne.
 */
export async function fetchTransitTexts(
  keys: string[],
  version: TransitVersion = 'short'
): Promise<Map<string, TransitText> | null> {
  const out = new Map<string, TransitText>();
  if (!isSupabaseConfigured || keys.length === 0) return out;

  const { data, error } = await supabase
    .from('transit_texts')
    .select('key, version, title, body, positive, challenge, advice, sections')
    .eq('version', version)
    .in('key', keys);

  if (error || !data) return null;
  for (const r of data as Row[]) out.set(r.key, toText(r));
  return out;
}

/**
 * Tekstovi koji su vec stigli, po kljucu. Bez ovoga svaka promena dana krene od
 * prazne mape, pa kartica na trenutak pokaze racunato ime tranzita umesto
 * naslova teksta (Ivan, 28.9.2026). Pamti se i "nema teksta" (null), da se
 * tranzit bez teksta ne ucitava iznova. Deo kljuca je nalog i pravo pristupa:
 * sta server vrati zavisi od RLS-a, pa posle kupovine ili odjave kes ne vazi.
 *
 * Ispod ovoga je kes NA DISKU (`kes-na-disku.ts`): rezerva kad server ne odgovori
 * (bez interneta). Upit sa servera ide i dalje, pri svakom pokretanju.
 */
const kes = new Map<string, TransitText | null>();
const BEZ_KLJUCEVA: string[] = [];

export function useTransitTexts(sviKljucevi: string[], version: TransitVersion = 'short') {
  // DUGA VERZIJA SAMO KAD PRIKAZ KAZE PREMIUM (Ivan, 30.9.2026): test prekidac "Besplatan"
  // na nalogu koji stvarno ima Premium je i dalje otvarao ceo tekst — server ga salje po
  // PRAVOM stanju (pravilo 8), a ekrani su ga prikazivali cim stigne. Sada se duga verzija
  // ni ne trazi, pa svaki ekran (tumacenje, "Tvoj dan", lista) izgleda kao za besplatne.
  // Pravom besplatnom nalogu se nista ne menja: server mu dugu verziju ionako ne salje.
  const premiumPrikaz = usePremium();
  const keys = version === 'long' && !premiumPrikaz ? BEZ_KLJUCEVA : sviKljucevi;
  const korisnik = useAuthStore((s) => s.user?.id ?? '');
  const pristup = useAuthStore((s) => (s.entitlement?.active ? 'p' : ''));
  const kesKljuc = (k: string) => `${korisnik}|${pristup}|${version}|${k}`;

  // Kljucevi se menjaju svakog dana; poredi se sadrzaj, ne referenca niza.
  const potpis = keys.join('|');
  const [stiglo, osvezi] = React.useReducer((n: number) => n + 1, 0);

  const fali = keys.filter((k) => !kes.has(kesKljuc(k)));
  // Potpis kljuceva za koje upit nije uspeo — tada se ne ceka u nedogled.
  const [palo, setPalo] = React.useState<string | null>(null);
  const diskUcitan = useKesUcitan();
  // Kad se mreza vrati, upit koji je pao ide ponovo (`povratak` je u zavisnostima).
  const povratak = usePovratakMreze();

  React.useEffect(() => {
    if (fali.length === 0) return;
    let otkazano = false;
    fetchTransitTexts(fali, version).then((m) => {
      if (otkazano) return;
      // Pad upita se ne pamti: `loading` se spusti, a upit ide ponovo sa sledecim
      // kljucevima (drugi dan) ili kad se ekran ponovo otvori.
      if (!m) { setPalo(potpis); return; }
      for (const k of fali) {
        const t = m.get(k) ?? null;
        kes.set(kesKljuc(k), t);
        if (t) kesUpisi(`tranzit|${kesKljuc(k)}`, t);
      }
      osvezi();
    });
    return () => { otkazano = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpis, version, korisnik, pristup, fali.length, povratak]);

  // Sa servera, pa sa diska ako server jos nije odgovorio (ili ne moze).
  const nadji = (k: string) => kes.get(kesKljuc(k)) ?? kesProcitaj<TransitText>(`tranzit|${kesKljuc(k)}`) ?? null;
  const naDisku = (k: string) => !!kesProcitaj(`tranzit|${kesKljuc(k)}`);

  // Racuna se u renderu, ne u efektu: vec prvi prikaz novog dana ima tekstove
  // iz kesa, a `loading` je tacan od prvog prikaza (efekat bi kasnio jedan frejm).
  // Ista mapa dok se nista ne promeni — pozivaoci je drze u zavisnostima efekata
  // (`tranziti-lista.tsx`), pa bi nova mapa u svakom renderu vrtela efekat u krug.
  const texts = React.useMemo(() => {
    const m = new Map<string, TransitText>();
    for (const k of keys) {
      const t = nadji(k);
      if (t) m.set(k, t);
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [potpis, version, korisnik, pristup, stiglo, fali.length, diskUcitan]);
  // Ceka se samo tekst kog nema ni na disku; ostalo se vec prikazuje.
  const ceka = fali.filter((k) => !naDisku(k));
  return { texts, loading: ceka.length > 0 && palo !== potpis };
}


/**
 * Rucna oznaka tona (`transit_texts.tone`, na KRATKOJ verziji) — kartica
 * "Tvoj dan" (`lib/tone.ts`). Poseban upit, namerno: dok kolona ne postoji u
 * bazi (`supabase/transit-tone.sql` nije pokrenut) upit vrati gresku, a ta
 * greska ne sme da obori tekstove. Bez oznake ton se racuna po pravilu.
 *
 * Kad upit ne uspe (bez interneta), vracaju se oznake sa diska — inace bi ton
 * bez interneta presao na pravilo i promenio se na kartici.
 */
export async function fetchTransitTones(keys: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (!isSupabaseConfigured || keys.length === 0) return out;
  const { data, error } = await supabase
    .from('transit_texts')
    .select('key, tone')
    .eq('version', 'short')
    .in('key', keys);
  if (error || !data) {
    await ucitajKes();
    for (const k of keys) {
      const t = kesProcitaj<string>(`ton|${k}`);
      if (t) out.set(k, t);
    }
    return out;
  }
  for (const r of data as { key: string; tone: string | null }[]) {
    if (r.tone) { out.set(r.key, r.tone); kesUpisi(`ton|${r.key}`, r.tone); }
  }
  return out;
}

export function useTransitTone(key: string | null): string | null {
  const [tone, setTone] = React.useState<string | null>(null);
  const povratak = usePovratakMreze();
  React.useEffect(() => {
    setTone(null);
    if (!key) return;
    let otkazano = false;
    fetchTransitTones([key]).then((m) => { if (!otkazano) setTone(m.get(key) ?? null); });
    return () => { otkazano = true; };
  }, [key, povratak]);
  return tone;
}
