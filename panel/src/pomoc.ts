/** Datumi i vreme za panel — srpski, bez biblioteka. */
import { mnozina } from '../../src/lib/mnozina';

const MESECI_GEN = [
  'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
  'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
];

/** "24. septembra u 14:05" (godina samo ako nije ova). */
export function datumIVreme(iso: string, sada = new Date()): string {
  const d = new Date(iso);
  const god = d.getFullYear() === sada.getFullYear() ? '' : ` ${d.getFullYear()}.`;
  const sat = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${d.getDate()}. ${MESECI_GEN[d.getMonth()]}${god} u ${sat}`;
}

/** Datum rodjenja iz snimka: "1990-07-10" -> "10. jula 1990." */
export function datumRodjenja(ymd: string): string {
  const [g, m, d] = ymd.split('-').map(Number);
  return `${d}. ${MESECI_GEN[m - 1]} ${g}.`;
}

/** Koliko je proslo: "pre 5 minuta", "pre 3 sata", "pre 2 dana". */
export function preKoliko(iso: string, sada = new Date()): string {
  const min = Math.max(0, Math.floor((sada.getTime() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return 'upravo';
  if (min < 60) return `pre ${min} ${mnozina(min, ['minut', 'minuta', 'minuta'])}`;
  const sati = Math.floor(min / 60);
  if (sati < 24) return `pre ${sati} ${mnozina(sati, ['sat', 'sata', 'sati'])}`;
  const dana = Math.floor(sati / 24);
  return `pre ${dana} ${mnozina(dana, ['dan', 'dana', 'dana'])}`;
}

/** 95 -> "1:35" */
export function trajanje(sek: number): string {
  const s = Math.max(0, Math.floor(sek));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Greska servera -> recenica za astrologa. */
export function porukaGreske(poruka: string | undefined): string {
  const m = poruka ?? '';
  if (/nije_astrolog/.test(m)) return 'Ovaj nalog nema pristup panelu.';
  if (/pitanje_nije_otvoreno/.test(m)) return 'Na ovo pitanje je već odgovoreno, ili je novac vraćen.';
  if (/nema_fajla|pogresna_putanja/.test(m)) return 'Snimak nije stigao na server. Pošalji ponovo.';
  if (/pogresno_trajanje/.test(m)) return 'Snimak je prazan ili duži od 15 minuta.';
  if (/mime|type/i.test(m)) return 'Taj format fajla nije podržan. Pošalji m4a, mp3 ili aac.';
  if (/size|large/i.test(m)) return 'Fajl je prevelik (najviše 25 MB).';
  if (/fetch|network/i.test(m)) return 'Nema veze sa serverom. Proveri internet i pošalji ponovo.';
  return `Nije uspelo: ${m || 'nepoznata greška'}. Pošalji ponovo.`;
}

/** Format snimka koji telefon korisnika sigurno pusta (iPhone i Android). */
export type VrstaSnimka = { ext: 'm4a' | 'mp3' | 'aac'; tip: 'audio/mp4' | 'audio/mpeg' | 'audio/aac' };

/**
 * Otpremljen fajl -> format za skladiste, ili razlog zasto ne moze.
 *
 * Primaju se SAMO formati koje iPhone pusta: m4a (Diktafon na iPhone-u, vecina
 * Android snimaca), mp3 i aac. Ostali cesti formati sa telefona dobijaju poruku
 * sa razlogom — ogg/opus (WhatsApp, neki Android snimaci) iPhone ne pusta, amr/3gp
 * su stari telefonski formati, wav je za 10 minuta veci od 50 MB.
 * Tip se odredjuje po NASTAVKU imena: telefoni cesto salju prazan ili opsti MIME.
 */
export function vrstaSnimka(ime: string, mime: string): VrstaSnimka | { greska: string } {
  const ext = ime.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';
  const m = mime.toLowerCase();
  if (ext === 'm4a' || ext === 'mp4' || (!ext && /mp4|m4a/.test(m))) return { ext: 'm4a', tip: 'audio/mp4' };
  if (ext === 'mp3' || (!ext && /mpeg|mp3/.test(m))) return { ext: 'mp3', tip: 'audio/mpeg' };
  if (ext === 'aac' || (!ext && /aac/.test(m))) return { ext: 'aac', tip: 'audio/aac' };
  const zasto =
    ext === 'ogg' || ext === 'opus' || ext === 'oga' || /ogg|opus/.test(m) ? 'Taj format (ogg/opus) iPhone ne pušta.'
      : ext === 'amr' || ext === '3gp' || ext === '3ga' ? 'Taj format (amr/3gp) iPhone ne pušta.'
        : ext === 'wav' || /wav/.test(m) ? 'WAV fajl je prevelik za odgovor od nekoliko minuta.'
          : ext === 'webm' || /webm/.test(m) ? 'Taj format (webm) iPhone ne pušta.'
            : 'Taj format nije podržan.';
  return { greska: `${zasto} Pošalji m4a, mp3 ili aac — u tom formatu snimaju Diktafon na iPhone-u i većina Android snimača.` };
}
