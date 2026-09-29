/**
 * Sve sto panel trazi od servera, na jednom mestu. Ekrani zovu `podaci()`, pa
 * probni rezim (`#/proba`, samo u razvoju) moze da podmetne izmisljena pitanja
 * bez naloga i bez baze (`proba.ts`).
 */
import { POLJA, supabase, type PitanjePanel } from './supabase';

export type Izvor = {
  lista(tab: 'ceka' | 'odgovoreno'): Promise<PitanjePanel[]>;
  pitanje(id: string): Promise<PitanjePanel | null>;
  /** Ostala poslata pitanja iste osobe, najnovija prva. */
  ranija(p: PitanjePanel): Promise<PitanjePanel[]>;
  /** Potpisan link za preslusavanje poslatog odgovora (sat vremena). */
  linkZvuka(putanja: string): Promise<string | null>;
  /** Otpremi snimak pa oznaci pitanje kao odgovoreno. Baca gresku sa porukom servera. */
  posaljiOdgovor(p: PitanjePanel, snimak: { blob: Blob; ext: 'm4a' | 'mp3' | 'aac'; tip: string; sekundi: number }): Promise<void>;
};

const pravi: Izvor = {
  async lista(tab) {
    const upit = supabase.from('pitanja').select(POLJA);
    // Roka nema: pitanja koja cekaju idu od najstarijeg. Vracen novac pre odgovora
    // = status `refunded` bez snimka, pa ga nema ni u jednoj listi.
    const { data, error } = tab === 'ceka'
      ? await upit.eq('status', 'paid').order('paid_at', { ascending: true })
      : await upit.not('audio_putanja', 'is', null).order('answered_at', { ascending: false }).limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []) as PitanjePanel[];
  },
  async pitanje(id) {
    const { data, error } = await supabase.from('pitanja').select(POLJA).eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    return data as PitanjePanel | null;
  },
  async ranija(p) {
    const { data } = await supabase.from('pitanja').select(POLJA)
      .eq('user_id', p.user_id).neq('id', p.id).order('paid_at', { ascending: false });
    return (data ?? []) as PitanjePanel[];
  },
  async linkZvuka(putanja) {
    const { data } = await supabase.storage.from('odgovori').createSignedUrl(putanja, 3600);
    return data?.signedUrl ?? null;
  },
  async posaljiOdgovor(p, s) {
    const put = `${p.user_id}/${p.id}.${s.ext}`;
    const { error: e1 } = await supabase.storage.from('odgovori').upload(put, s.blob, { contentType: s.tip, upsert: true });
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabase.rpc('odgovori_na_pitanje', { p_pitanje: p.id, p_putanja: put, p_trajanje: s.sekundi });
    if (e2) throw new Error(e2.message);
  },
};

let aktivan: Izvor = pravi;

export const podaci = () => aktivan;

export function koristiIzvor(i: Izvor) { aktivan = i; }
