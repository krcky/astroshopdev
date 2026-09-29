import { useCallback, useEffect, useState } from 'react';

import type { PitanjePanel } from './supabase';
import { podaci } from './podaci';
import { datumIVreme, preKoliko, trajanje } from './pomoc';
import { Karta } from './karta';
import { Snimac } from './snimac';
import { USPEH_KLJUC } from './lista';
import { idi } from './app';

/**
 * Jedno pitanje: levo pitanje i odgovor (snimac), desno karta i ranija pitanja
 * iste osobe. Na uskom ekranu sve ide jedno ispod drugog.
 */
export function Pitanje({ id }: { id: string }) {
  const [p, setP] = useState<PitanjePanel | null | undefined>(undefined);
  const [ranija, setRanija] = useState<PitanjePanel[]>([]);
  const [greska, setGreska] = useState<string | null>(null);
  const [zvuk, setZvuk] = useState<string | null>(null);

  const ucitaj = useCallback(async () => {
    let q: PitanjePanel | null;
    try { q = await podaci().pitanje(id); } catch (e) { setGreska((e as Error).message); return; }
    setP(q);
    if (!q) return;
    setRanija(await podaci().ranija(q));
    if (q.audio_putanja) setZvuk(await podaci().linkZvuka(q.audio_putanja));
  }, [id]);

  useEffect(() => { setP(undefined); setRanija([]); setZvuk(null); ucitaj(); }, [ucitaj]);

  const poslato = () => {
    sessionStorage.setItem(USPEH_KLJUC, `Odgovor je poslat${p?.karta?.ime ? ` (${p.karta.ime})` : ''}.`);
    idi('/');
  };

  return (
    <div className="strana" style={{ maxWidth: 1100 }}>
      <button className="tiho" style={{ marginLeft: -8, marginBottom: 12 }} onClick={() => idi('/')}>← Sva pitanja</button>

      {greska && <p className="greska">Pitanje nije učitano: {greska}</p>}
      {p === undefined && !greska && <p className="siv">Učitavam…</p>}
      {p === null && <div className="kartica"><p className="siv">Ovo pitanje ne postoji ili nije poslato.</p></div>}

      {p && (
        <div className="raspored">
          <div className="levo">
            <h1>
              {p.karta?.ime ?? 'Bez imena'}
              {p.sandbox && <span className="oznaka" title="Probna kupovina (sandbox)">TEST</span>}
            </h1>
            <p className="siv" style={{ marginBottom: 16 }}>
              Poslato {datumIVreme(p.paid_at ?? p.created_at)}
              {p.status === 'paid' && ` · čeka ${preKoliko(p.paid_at ?? p.created_at).replace(/^pre /, '')}`}
            </p>
            <div className="kartica"><p className="pitanje-tekst">{p.tekst}</p></div>

            <div className="odeljak">
              <h2>Odgovor</h2>
              {p.status === 'paid' && <Snimac p={p} onPoslato={poslato} />}
              {p.audio_putanja && (
                <div className="kartica">
                  <p className="siv">
                    Poslato {datumIVreme(p.answered_at ?? p.created_at)}
                    {p.audio_trajanje ? ` · ${trajanje(p.audio_trajanje)}` : ''}
                  </p>
                  {zvuk ? <audio controls src={zvuk} /> : <p className="siv sitno">Snimak nije učitan — osveži stranu.</p>}
                </div>
              )}
              {p.status === 'refunded' && !p.audio_putanja && (
                <div className="napomena">Novac za ovo pitanje je vraćen pre odgovora — odgovor se ne šalje.</div>
              )}
            </div>
          </div>

          <div>
            <h2>Karta</h2>
            <Karta k={p.karta} />

            {ranija.length > 0 && (
              <div className="odeljak">
                <h2>Ranija pitanja</h2>
                {ranija.map((r) => (
                  <button key={r.id} className="stavka" onClick={() => idi(`/pitanje/${r.id}`)}>
                    <div className="stavka-vrh">
                      <span className="siv sitno">{datumIVreme(r.paid_at ?? r.created_at)}</span>
                      <span className="siv sitno">{r.audio_putanja ? 'odgovoreno' : r.status === 'paid' ? 'čeka odgovor' : 'novac vraćen'}</span>
                    </div>
                    <div className="stavka-tekst">{r.tekst}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
