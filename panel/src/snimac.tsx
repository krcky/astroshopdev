import { useEffect, useMemo, useRef, useState } from 'react';

import type { PitanjePanel } from './supabase';
import { podaci } from './podaci';
import { porukaGreske, trajanje, vrstaSnimka } from './pomoc';

/** Najduzi odgovor. Baza prima do 15 min (rezerva), panel ne pusta preko 10. */
const MAX_SEKUNDI = 600;
/** Isto ogranicenje kao skladiste (`pitanja.sql`, `file_size_limit`). */
const MAX_BAJTOVA = 25 * 1024 * 1024;

/**
 * Format snimanja. iPhone ne pusta WebM/Opus, pa se snima SAMO u MP4 (AAC).
 * Safari to ume, noviji Chrome takodje; Firefox ne — tada ostaje otpremanje
 * gotovog fajla (`vrstaSnimka`). Prvo se trazi izricito AAC, pa opsti MP4 (Safari).
 */
function formatSnimanja(): string | null {
  if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return null;
  return ['audio/mp4;codecs=mp4a.40.2', 'audio/mp4'].find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

type Snimak = {
  blob: Blob;
  url: string;
  sekundi: number;
  ext: 'm4a' | 'mp3' | 'aac';
  tip: 'audio/mp4' | 'audio/mpeg' | 'audio/aac';
  ime?: string;
};

type Stanje = 'spreman' | 'snima' | 'gotovo' | 'salje';

/**
 * Glasovni odgovor: snimi (do 10 min) -> preslusaj -> snimi ponovo ili posalji.
 * Ili OTPREMI snimak napravljen na telefonu (Ivan, 29.9.2026): Diktafon na
 * iPhone-u, snimac na Androidu — m4a, mp3 ili aac (`vrstaSnimka`). Slanje = otpremanje u privatno skladiste
 * (`odgovori/<korisnik>/<pitanje>.<ext>`) pa `odgovori_na_pitanje` u bazi, koja
 * proveri da fajl postoji i tek onda oznaci pitanje kao odgovoreno.
 */
export function Snimac({ p, onPoslato }: { p: PitanjePanel; onPoslato: () => void }) {
  const format = useMemo(formatSnimanja, []);
  const [stanje, setStanje] = useState<Stanje>('spreman');
  const [sekundi, setSekundi] = useState(0);
  const [snimak, setSnimak] = useState<Snimak | null>(null);
  const [greska, setGreska] = useState<string | null>(null);
  const snimac = useRef<MediaRecorder | null>(null);
  const tajmer = useRef<number | null>(null);
  const fajl = useRef<HTMLInputElement>(null);

  // Snimak koji nije poslat ne sme da nestane slucajnim zatvaranjem kartice.
  useEffect(() => {
    if (stanje === 'spreman') return;
    const pitaj = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', pitaj);
    return () => window.removeEventListener('beforeunload', pitaj);
  }, [stanje]);

  useEffect(() => () => {
    if (tajmer.current) clearInterval(tajmer.current);
    if (snimac.current?.state === 'recording') snimac.current.stop();
  }, []);

  const postavi = (s: Snimak | null) => {
    setSnimak((staro) => { if (staro) URL.revokeObjectURL(staro.url); return s; });
  };

  const snimaj = async () => {
    if (!format) return;
    setGreska(null);
    let tok: MediaStream;
    try {
      tok = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setGreska('Pregledač nema dozvolu za mikrofon. Dozvoli mikrofon za ovu stranu (ikonica levo od adrese) pa probaj ponovo.');
      return;
    }
    const r = new MediaRecorder(tok, { mimeType: format, audioBitsPerSecond: 96_000 });
    const delovi: Blob[] = [];
    const pocetak = Date.now();
    r.ondataavailable = (e) => { if (e.data.size > 0) delovi.push(e.data); };
    r.onstop = () => {
      tok.getTracks().forEach((t) => t.stop());
      if (tajmer.current) { clearInterval(tajmer.current); tajmer.current = null; }
      const blob = new Blob(delovi, { type: 'audio/mp4' });
      const sek = Math.min(MAX_SEKUNDI, Math.max(1, Math.round((Date.now() - pocetak) / 1000)));
      postavi({ blob, url: URL.createObjectURL(blob), sekundi: sek, ext: 'm4a', tip: 'audio/mp4' });
      setStanje('gotovo');
    };
    r.start(1000);
    snimac.current = r;
    setSekundi(0);
    setStanje('snima');
    tajmer.current = window.setInterval(() => {
      const s = (Date.now() - pocetak) / 1000;
      setSekundi(Math.floor(s));
      if (s >= MAX_SEKUNDI && r.state === 'recording') r.stop();
    }, 250);
  };

  const stani = () => { if (snimac.current?.state === 'recording') snimac.current.stop(); };

  const izFajla = async (f: File | undefined) => {
    if (!f) return;
    setGreska(null);
    const vrsta = vrstaSnimka(f.name, f.type);
    if ('greska' in vrsta) { setGreska(vrsta.greska); return; }
    if (f.size > MAX_BAJTOVA) { setGreska('Fajl je veći od 25 MB.'); return; }
    const url = URL.createObjectURL(f);
    const sek = await trajanjeFajla(url);
    if (!sek) { URL.revokeObjectURL(url); setGreska('Fajl ne može da se pusti. Proveri da li je ceo — probaj da ga pustiš na računaru.'); return; }
    if (sek > MAX_SEKUNDI + 1) { URL.revokeObjectURL(url); setGreska('Snimak je duži od 10 minuta. Skrati ga pa pošalji.'); return; }
    postavi({ blob: f, url, sekundi: Math.max(1, Math.round(sek)), ext: vrsta.ext, tip: vrsta.tip, ime: f.name });
    setStanje('gotovo');
  };

  const posalji = async () => {
    if (!snimak) return;
    if (!window.confirm(`Poslati odgovor (${trajanje(snimak.sekundi)})? Posle slanja ne može da se menja.`)) return;
    setStanje('salje');
    setGreska(null);
    try {
      await podaci().posaljiOdgovor(p, snimak);
    } catch (e) {
      setGreska(porukaGreske((e as Error).message));
      setStanje('gotovo');
      return;
    }
    postavi(null);
    setStanje('spreman');
    onPoslato();
  };

  const ponovo = () => { postavi(null); setStanje('spreman'); if (fajl.current) fajl.current.value = ''; };

  return (
    <div className="kartica">
      {stanje === 'spreman' && (
        <>
          {format ? (
            <p className="siv">
              Snimi odgovor ovde, ili otpremi snimak koji si napravio na telefonu. Najviše 10 minuta;
              pre slanja možeš da ga preslušaš.
            </p>
          ) : (
            <p className="siv">
              Ovaj pregledač ne snima u formatu koji iPhone pušta. Otvori panel u Safariju ili Chrome-u,
              ili otpremi snimak sa telefona.
            </p>
          )}
          <div className="red-dugmadi">
            {format && <button className="crno" onClick={snimaj}>Snimi odgovor</button>}
            <button className={format ? 'sivo' : 'crno'} onClick={() => fajl.current?.click()}>Otpremi snimak</button>
          </div>
          <details className="uputstvo">
            <summary>Kako da otpremim snimak sa telefona</summary>
            <ol>
              <li><strong>iPhone:</strong> snimi u Diktafonu (Voice Memos), otvori snimak → Podeli → Sačuvaj u Fajlove.</li>
              <li><strong>Android:</strong> snimi u aplikaciji za snimanje zvuka — fajl je već sačuvan na telefonu.</li>
              <li>Otvori ovaj panel na telefonu i pritisni „Otpremi snimak", pa izaberi fajl. Može i sa računara, ako ga prebaciš tamo.</li>
            </ol>
            <p className="siv sitno">Formati: m4a, mp3 ili aac. Najviše 10 minuta i 25 MB.</p>
          </details>
        </>
      )}

      {stanje === 'snima' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="tacka" />
            <span className="snimac-vreme">{trajanje(sekundi)}</span>
            <span className="siv">/ {trajanje(MAX_SEKUNDI)}</span>
          </div>
          {MAX_SEKUNDI - sekundi <= 60 && <p className="crveno sitno" style={{ marginTop: 6 }}>Snimanje staje samo za {MAX_SEKUNDI - sekundi} s.</p>}
          <div className="red-dugmadi"><button className="crveno-dugme" onClick={stani}>Završi snimanje</button></div>
        </>
      )}

      {(stanje === 'gotovo' || stanje === 'salje') && snimak && (
        <>
          <p><strong>{snimak.ime ?? 'Tvoj snimak'}</strong> <span className="siv">· {trajanje(snimak.sekundi)}</span></p>
          <audio controls src={snimak.url} />
          <div className="red-dugmadi">
            <button className="crno" onClick={posalji} disabled={stanje === 'salje'}>{stanje === 'salje' ? 'Šaljem…' : 'Pošalji odgovor'}</button>
            <button className="sivo" onClick={ponovo} disabled={stanje === 'salje'}>{snimak.ime ? 'Drugi snimak' : 'Snimi ponovo'}</button>
          </div>
        </>
      )}

      {/* `audio/*`: na telefonu otvara i izbor iz Fajlova; format proverava `vrstaSnimka`. */}
      <input ref={fajl} type="file" accept="audio/*,.m4a,.mp3,.aac" hidden onChange={(e) => izFajla(e.target.files?.[0])} />
      {greska && <p className="greska">{greska}</p>}
    </div>
  );
}

/** Trajanje fajla u sekundama iz samog pregledaca; 0 ako ne moze da se procita. */
function trajanjeFajla(url: string): Promise<number> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = 'metadata';
    a.onloadedmetadata = () => resolve(Number.isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => resolve(0);
    a.src = url;
  });
}
