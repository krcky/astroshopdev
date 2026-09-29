import { useCallback, useEffect, useState } from 'react';

import { supabase, type PitanjePanel } from './supabase';
import { podaci } from './podaci';
import { datumIVreme, preKoliko } from './pomoc';
import { idi } from './app';

type Tab = 'ceka' | 'odgovoreno';

/** Poruka posle slanja odgovora — `pitanje.tsx` je ostavi, lista je pokaze jednom. */
export const USPEH_KLJUC = 'astroshop-panel-uspeh';

/**
 * Pitanja koja cekaju odgovor, najstarije prvo — roka nema (Ivan, 29.9.2026),
 * pa samo pise koliko dugo pitanje ceka (bez boje i bez posledica).
 */
export function Lista({ email }: { email: string }) {
  const [tab, setTab] = useState<Tab>('ceka');
  const [pitanja, setPitanja] = useState<PitanjePanel[] | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const [uspeh] = useState(() => { const u = sessionStorage.getItem(USPEH_KLJUC); sessionStorage.removeItem(USPEH_KLJUC); return u; });

  const ucitaj = useCallback(async () => {
    try {
      setPitanja(await podaci().lista(tab));
      setGreska(null);
    } catch (e) {
      setGreska((e as Error).message);
    }
  }, [tab]);

  useEffect(() => {
    setPitanja(null);
    ucitaj();
    // Nova pitanja stizu sama: osvezavanje na minut dok je strana otvorena i vidljiva.
    const t = setInterval(() => { if (document.visibilityState === 'visible') ucitaj(); }, 60_000);
    const naPovratak = () => { if (document.visibilityState === 'visible') ucitaj(); };
    document.addEventListener('visibilitychange', naPovratak);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', naPovratak); };
  }, [ucitaj]);

  return (
    <div className="strana">
      <div className="zaglavlje">
        <h1>Pitanja</h1>
        <div>
          <span className="siv sitno">{email}</span>
          <button className="tiho" onClick={() => supabase.auth.signOut()}>Odjavi se</button>
        </div>
      </div>

      {uspeh && <div className="poruka-uspeh">{uspeh}</div>}

      <div className="tabovi" role="tablist">
        <button role="tab" className={tab === 'ceka' ? 'aktivan' : ''} onClick={() => setTab('ceka')}>
          Čekaju odgovor{tab === 'ceka' && pitanja ? ` · ${pitanja.length}` : ''}
        </button>
        <button role="tab" className={tab === 'odgovoreno' ? 'aktivan' : ''} onClick={() => setTab('odgovoreno')}>Odgovoreno</button>
      </div>

      {greska && <p className="greska">Lista nije učitana: {greska}</p>}
      {!greska && pitanja === null && <p className="siv">Učitavam…</p>}
      {pitanja?.length === 0 && (
        <div className="kartica"><p className="siv">{tab === 'ceka' ? 'Nema pitanja koja čekaju odgovor.' : 'Još nema odgovorenih pitanja.'}</p></div>
      )}

      {pitanja?.map((p) => (
        <button key={p.id} className="stavka" onClick={() => idi(`/pitanje/${p.id}`)}>
          <div className="stavka-vrh">
            <strong>
              {p.karta?.ime ?? 'Bez imena'}
              {/* Pitanje o drugoj osobi: ko pita (snimak v2). */}
              {p.karta?.drugaOsoba && (
                <span className="siv sitno" style={{ fontWeight: 'normal' }}>
                  {' '}· pita {p.karta.drugaOsoba.pita}{p.karta.drugaOsoba.mojaKarta ? ', o odnosu' : ''}
                </span>
              )}
              {p.sandbox && <span className="oznaka" title="Probna kupovina (sandbox) — i Apple-ovi recenzenti kupuju ovako">TEST</span>}
            </strong>
            <span className="siv sitno">
              {tab === 'ceka' ? ceka(p.paid_at ?? p.created_at) : `odgovoreno ${datumIVreme(p.answered_at ?? p.created_at)}`}
            </span>
          </div>
          <div className="stavka-tekst">{p.tekst}</div>
        </button>
      ))}
    </div>
  );
}

/** "čeka 2 dana", a za tek stiglo "stiglo upravo". */
function ceka(iso: string): string {
  const k = preKoliko(iso);
  return k === 'upravo' ? 'stiglo upravo' : `čeka ${k.replace(/^pre /, '')}`;
}
