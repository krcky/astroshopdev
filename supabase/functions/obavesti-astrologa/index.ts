/**
 * Mejl astrologu kad stigne novo pitanje (Ivan, 29.9.2026).
 *
 * KO ZOVE: okidac u bazi (`supabase/pitanja-obavestenja.sql`) preko `pg_net`,
 * cim pitanje predje u `paid` — kupovinom ili kreditom. Telo: `{ pitanje_id }`.
 *
 * ZASTO BEZ TOKENA (`--no-verify-jwt`): `pg_net` ne nosi korisnikov token, a
 * funkcija nista ne veruje telu zahteva osim id-ja. Mejl ide SAMO astrolozima
 * iz tabele `astrolozi`, SAMO za pitanje koje je zaista placeno, i SAMO JEDNOM:
 * pitanje se prvo "zauzme" upisom `obavesteno_at` (uslov `is null`), pa ni
 * ponovljen poziv ni tudji poziv ne mogu da posalju drugi mejl. Odgovor je
 * uvek isti, da se po njemu ne pogadja koji id postoji.
 *
 * SADRZAJ: ime, vreme i link u panel — bez teksta pitanja i podataka o rodjenju
 * (`_shared/obavestenje.ts`). SendGrid pracenje klikova i otvaranja je iskljuceno.
 * Ako slanje ne uspe, `obavesteno_at` se vraca na NULL (vidi log funkcije).
 *
 * Tajne (Supabase -> Edge Functions -> Secrets, ili `supabase secrets set`):
 *   SENDGRID_API_KEY   SendGrid kljuc sa pravom "Mail Send"            (obavezno)
 *   MAIL_FROM          posiljalac, mora biti @astroshop.rs (DKIM)     (podraz. info@astroshop.rs)
 *   PANEL_URL          adresa panela za link u mejlu                  (podraz. https://panel.astroshop.rs)
 * SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY Supabase ubacuje sam.
 *
 * Deploy:
 *   npx supabase functions deploy obavesti-astrologa --project-ref vwpmsqqwndsoakwhcmzt --no-verify-jwt
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

import { mejlZaAstrologa } from '../_shared/obavestenje.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const gotovo = () => new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') return gotovo();

  let id = '';
  try { id = String((await req.json())?.pitanje_id ?? ''); } catch { /* prazno telo */ }
  if (!UUID.test(id)) return gotovo();

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // Zauzmi: samo placeno pitanje, samo jednom.
  const { data: q, error } = await admin
    .from('pitanja')
    .update({ obavesteno_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'paid')
    .is('obavesteno_at', null)
    .select('id, paid_at, created_at, sandbox, karta')
    .maybeSingle();
  if (error) { console.error('pitanje nije procitano', id, error.message); return gotovo(); }
  if (!q) return gotovo();

  const vrati = async (zasto: string) => {
    console.error('mejl nije poslat', id, zasto);
    await admin.from('pitanja').update({ obavesteno_at: null }).eq('id', id);
  };

  const kljuc = Deno.env.get('SENDGRID_API_KEY');
  if (!kljuc) { await vrati('SENDGRID_API_KEY nije postavljen'); return gotovo(); }

  // Adrese astrologa — iz naloga, ne iz zahteva.
  const { data: astrolozi } = await admin.from('astrolozi').select('user_id');
  const adrese: string[] = [];
  for (const a of astrolozi ?? []) {
    const { data } = await admin.auth.admin.getUserById(a.user_id);
    if (data.user?.email) adrese.push(data.user.email);
  }
  if (adrese.length === 0) { await vrati('nema nijednog astrologa sa emailom'); return gotovo(); }

  const m = mejlZaAstrologa(
    { id: q.id, ime: (q.karta as { ime?: string } | null)?.ime ?? null, poslato: q.paid_at ?? q.created_at, sandbox: q.sandbox },
    Deno.env.get('PANEL_URL') ?? 'https://panel.astroshop.rs',
  );

  const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${kljuc}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // Svako dobija svoj mejl — astrolozi ne vide jedni druge adrese.
      personalizations: adrese.map((email) => ({ to: [{ email }] })),
      from: { email: Deno.env.get('MAIL_FROM') ?? 'info@astroshop.rs', name: 'Astroshop' },
      subject: m.naslov,
      content: [{ type: 'text/plain', value: m.tekst }, { type: 'text/html', value: m.html }],
      // Bez pracenja: aplikacija nema analitiku, pa ni mejl (i link ostaje citljiv).
      tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
    }),
  });
  if (!r.ok) await vrati(`SendGrid ${r.status}: ${(await r.text()).slice(0, 300)}`);

  return gotovo();
});
