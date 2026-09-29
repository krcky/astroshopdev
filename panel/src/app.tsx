import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { podeseno, supabase } from './supabase';
import { koristiIzvor } from './podaci';
import { Prijava } from './prijava';
import { Lista } from './lista';
import { Pitanje } from './pitanje';

/**
 * Kapija panela: nema sesije -> prijava; sesija bez uloge astrologa -> poruka;
 * astrolog -> lista ili pitanje. Adresa je u hash-u (`#/pitanje/<id>`), pa
 * osvezavanje strane i dugme "nazad" rade.
 *
 * Uloga se ovde samo PRIKAZUJE. Pravu kapiju drzi baza: bez reda u `astrolozi`
 * RLS ne vraca nijedno pitanje, pa ni izmenjen panel ne bi video nista.
 *
 * `#/proba` (samo `npm run panel`, ne i build): izmisljena pitanja bez prijave,
 * za pregled izgleda (`proba.ts`).
 */
export function App() {
  const [sesija, setSesija] = useState<Session | null | undefined>(undefined);
  const [astrolog, setAstrolog] = useState<boolean | null>(null);
  const [adresa, setAdresa] = useState(() => window.location.hash);
  const proba = import.meta.env.DEV && adresa.startsWith('#/proba');
  const [probaSpremna, setProbaSpremna] = useState(false);

  useEffect(() => {
    if (!proba) return;
    import('./proba').then((m) => { koristiIzvor(m.probniIzvor); prefiks = '/proba'; setProbaSpremna(true); });
  }, [proba]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesija(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSesija(s));
    const naHash = () => setAdresa(window.location.hash);
    window.addEventListener('hashchange', naHash);
    return () => { data.subscription.unsubscribe(); window.removeEventListener('hashchange', naHash); };
  }, []);

  useEffect(() => {
    setAstrolog(null);
    if (!sesija) return;
    supabase.rpc('je_astrolog').then(({ data, error }) => setAstrolog(!error && data === true));
  }, [sesija?.user.id]);

  if (proba) {
    return probaSpremna ? ruta(adresa.slice('#/proba'.length), 'proba (izmišljena pitanja)') : null;
  }
  if (!podeseno) {
    return <div className="uska"><h1>Panel nije podešen</h1><p className="siv">U `.env` nedostaju EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY.</p></div>;
  }
  if (sesija === undefined || (sesija && astrolog === null)) {
    return <div className="uska"><p className="siv">Učitavam…</p></div>;
  }
  if (!sesija) return <Prijava />;
  if (!astrolog) {
    return (
      <div className="uska">
        <h1>Nema pristupa</h1>
        <p className="siv">Nalog {sesija.user.email} nije upisan kao astrolog. Ako je greška, javi se Ivanu.</p>
        <div className="red-dugmadi"><button className="sivo" onClick={() => supabase.auth.signOut()}>Odjavi se</button></div>
      </div>
    );
  }

  return ruta(adresa.slice(1), sesija.user.email ?? '');
}

function ruta(put: string, email: string) {
  const pitanjeId = put.match(/^\/pitanje\/([0-9a-f-]{36})$/)?.[1];
  return pitanjeId ? <Pitanje id={pitanjeId} /> : <Lista email={email} />;
}

/** Deo adrese ispred svake strane — `/proba` u probnom rezimu. */
let prefiks = '';

export function idi(put: string) {
  window.location.hash = prefiks + put;
  window.scrollTo(0, 0);
}
