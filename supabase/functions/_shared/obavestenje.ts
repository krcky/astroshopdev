/**
 * Mejl astrologu kad stigne novo pitanje — CIST racun, bez Deno-a, da ga
 * proverava `scripts/check-pitanja.ts`. Salje ga `obavesti-astrologa/index.ts`.
 *
 * U mejlu NEMA teksta pitanja ni podataka o rodjenju — mejl je samo zvono. Mejl
 * prolazi kroz SendGrid i ostaje u sanducetu; pitanje se cita u panelu, iza prijave.
 */

const MESECI_GEN = [
  'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
  'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
];

export type NovoPitanje = {
  id: string;
  /** Ime iz snimka karte; korisnik ga je sam upisao — nikad ga ne verovati kao HTML. */
  ime: string | null;
  /** Kad je pitanje placeno (ISO). */
  poslato: string;
  /** Probna kupovina (sandbox) — i Apple-ovi recenzenti kupuju tako. */
  sandbox: boolean;
};

export type Mejl = { naslov: string; tekst: string; html: string; link: string };

/** "29. septembra u 14:05" po beogradskom vremenu (astrolog je u Srbiji). */
export function kadBeograd(iso: string): string {
  const delovi = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Belgrade', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const d = (t: string) => delovi.find((x) => x.type === t)?.value ?? '';
  return `${Number(d('day'))}. ${MESECI_GEN[Number(d('month')) - 1]} u ${d('hour')}:${d('minute')}`;
}

/** Ime za naslov i tekst: bez novih redova i kontrolnih znakova, najvise 60 znakova. */
export function cistoIme(ime: string | null): string {
  const s = (ime ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  return s || 'bez imena';
}

function html(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function mejlZaAstrologa(p: NovoPitanje, panelUrl: string): Mejl {
  const ime = cistoIme(p.ime);
  const kad = kadBeograd(p.poslato);
  const link = `${panelUrl.replace(/\/+$/, '')}/#/pitanje/${encodeURIComponent(p.id)}`;
  const test = p.sandbox ? 'Probna kupovina (sandbox) — verovatno Apple-ov pregled ili test, ne pravi kupac.' : null;

  const naslov = `Novo pitanje${p.sandbox ? ' [TEST]' : ''}: ${ime}`;
  const tekst = [
    'Stiglo je novo pitanje za astrologa.',
    '',
    `Ime: ${ime}`,
    `Poslato: ${kad}`,
    ...(test ? [test] : []),
    '',
    `Otvori pitanje u panelu: ${link}`,
    '',
    'Tekst pitanja i karta su u panelu, iza prijave.',
    '',
    '— Astro Shop',
  ].join('\n');

  const telo = `<!doctype html><html><body style="margin:0;padding:24px;background:#F6F7F8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#151515">
<div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:20px;padding:24px">
<p style="margin:0 0 16px;font-size:17px;font-weight:600">Stiglo je novo pitanje za astrologa.</p>
<p style="margin:0;color:#727273">Ime: <span style="color:#151515">${html(ime)}</span></p>
<p style="margin:4px 0 0;color:#727273">Poslato: <span style="color:#151515">${html(kad)}</span></p>
${test ? `<p style="margin:12px 0 0;color:#727273">${html(test)}</p>` : ''}
<p style="margin:24px 0 0"><a href="${html(link)}" style="display:inline-block;background:#151515;color:#FFFFFF;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Otvori pitanje</a></p>
<p style="margin:24px 0 0;font-size:13px;color:#9C9C9D">Tekst pitanja i karta su u panelu, iza prijave.</p>
</div></body></html>`;

  return { naslov, tekst, html: telo, link };
}
