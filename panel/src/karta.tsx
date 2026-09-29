import { useMemo } from 'react';

import type { SnimakKarte } from '../../src/lib/pitanja-snimak';
import { buildNatalChart } from '@/lib/natal';
import { datumRodjenja } from './pomoc';
import { Tocak } from './tocak';

/**
 * Podaci o rodjenju i karta iz snimka koji je aplikacija poslala uz pitanje
 * (`snimakKarte` u `src/lib/pitanja.ts`) — isti racun koji korisnik vidi u tabu
 * "Ti". Kad nesto nije pouzdano, snimak to kaze i ovde se pise (pravila 4 i 5).
 */
export function Karta({ k }: { k: SnimakKarte | null }) {
  // Tocak se crta iz podataka o rodjenju ISTIM racunom kao u aplikaciji
  // (`buildNatalChart`, kao `resolveProfile`), pa radi i za ranije poslata pitanja.
  const chart = useMemo(() => {
    if (!k || k.zonaNepouzdana) return null;
    const r = k.rodjenje;
    return buildNatalChart({ date: new Date(r.utc), latitude: r.sirina, longitude: r.duzina },
      k.vremeNepoznato ? 'whole-sign' : 'placidus');
  }, [k]);

  if (!k) {
    return <div className="kartica"><p className="siv">Uz ovo pitanje nije stigla karta (profil nije bio učitan na telefonu).</p></div>;
  }
  const r = k.rodjenje;
  return (
    <>
      <div className="kartica">
        <h3>Rođenje</h3>
        <dl className="podaci">
          <dt>Ime</dt><dd>{k.ime}</dd>
          <dt>Datum</dt><dd>{datumRodjenja(r.datum)}</dd>
          <dt>Vreme</dt><dd>{r.vreme ?? <span className="crveno">nepoznato</span>}</dd>
          <dt>Mesto</dt><dd>{r.mesto}{r.zemlja ? `, ${r.zemlja}` : ''}</dd>
          <dt>Koordinate</dt><dd>{r.sirina.toFixed(4)}, {r.duzina.toFixed(4)}</dd>
          <dt>Zona</dt><dd>{r.zona} · UTC {r.utc.replace('T', ' ').slice(0, 16)}</dd>
          <dt>Kuće</dt><dd>{k.sistemKuca === 'placidus' ? 'Placidus' : k.sistemKuca === 'whole-sign' ? 'Whole Sign' : '—'}</dd>
        </dl>
      </div>

      {k.zonaNepouzdana && (
        <div className="napomena" style={{ marginTop: 12 }}>
          Za ovo mesto i datum aplikacija ne zna pouzdano pomeraj vremenske zone, pa kartu nije izračunala.
          Izračunaj je iz podataka o rođenju.
        </div>
      )}
      {k.vremeNepoznato && !k.zonaNepouzdana && (
        <div className="napomena" style={{ marginTop: 12 }}>
          Vreme rođenja nije poznato: planete su računate za podne, nema ascendenta ni kuća,
          a Mesec može biti i do 7° dalje. Mesečevi aspekti su izostavljeni.
        </div>
      )}

      {chart && (
        <div className="kartica" style={{ marginTop: 12 }}>
          <h3>Natalni krug</h3>
          <Tocak chart={chart} bezKuca={k.vremeNepoznato} />
        </div>
      )}

      {!k.zonaNepouzdana && (
        <div className="dve-kolone" style={{ marginTop: 12 }}>
          <div className="kartica">
            <h3>Planete</h3>
            <table>
              <thead><tr><th>Planeta</th><th>Položaj</th><th className="broj">Kuća</th></tr></thead>
              <tbody>
                {k.planete.map((p) => (
                  <tr key={p.kljuc}>
                    <td>{p.ime}{p.retro ? <span className="bled"> R</span> : null}</td>
                    <td>{p.stepen}</td>
                    <td className="broj">{p.kuca ?? '—'}</td>
                  </tr>
                ))}
                {k.ascendent && <tr><td>Ascendent</td><td>{k.ascendent.stepen}</td><td className="broj">1</td></tr>}
                {k.mc && <tr><td>MC</td><td>{k.mc.stepen}</td><td className="broj">10</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="kartica">
            <h3>Aspekti</h3>
            {k.aspekti.length === 0 ? <p className="siv">Nema aspekata u orbisu.</p> : (
              <table>
                <tbody>
                  {k.aspekti.map((a, i) => (
                    <tr key={i}><td>{a.a} {a.aspekt} {a.b}</td><td className="broj siv">{a.orbis}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {k.kuce && (
            <div className="kartica">
              <h3>Kuspide</h3>
              <table>
                <tbody>
                  {k.kuce.map((c, i) => (
                    <tr key={i}><td>{i + 1}. kuća</td><td className="broj">{c.stepen}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
