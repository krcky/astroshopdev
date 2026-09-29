/**
 * Brisanje naloga.
 *
 * ZASTO POSTOJI: Apple trazi brisanje naloga UNUTAR aplikacije za svaku
 * aplikaciju koja pravi naloge (smernica 5.1.1v). Web stranica sa zahtevom
 * zadovoljava Google Play, ali ne i Apple.
 *
 * ZASTO NA SERVERU: brisanje naloga u `auth.users` moze samo `service_role`
 * kljuc, a on po pravilu 9 ne sme da postoji u aplikaciji. Zato ovde.
 *
 * SIGURNOST — jedno pravilo nosi sve ostalo:
 * KOGA brisemo odlucuje ISKLJUCIVO token iz Authorization zaglavlja, nikad
 * telo zahteva. Da id korisnika stize iz body-ja, svako sa javnim anon kljucem
 * mogao bi da obrise bilo ciji nalog jednim pozivom.
 *
 * Profil, pravo pristupa i pitanja astrologu se brisu sami — vezani su za
 * auth.users sa `on delete cascade`. Glasovne odgovore (fajlove) brise ova
 * funkcija, pre naloga.
 *
 * Deploy:  npx supabase functions deploy delete-account
 * Kljucevi SUPABASE_URL, SUPABASE_ANON_KEY i SUPABASE_SERVICE_ROLE_KEY
 * Supabase sam ubacuje u okruzenje funkcije — ne postavljati ih rucno.
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const authorization = req.headers.get('Authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) return json(401, { error: 'no_token' });

  // Provera tokena ide kroz anon klijenta sa korisnikovim zaglavljem — isti
  // put kojim bi prosao i bilo koji drugi zahtev te osobe.
  const kaoKorisnik = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  );

  const { data, error } = await kaoKorisnik.auth.getUser();
  if (error || !data.user) return json(401, { error: 'invalid_token' });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Glasovni odgovori astrologa (`supabase/pitanja.sql`) su FAJLOVI u skladistu —
  // `on delete cascade` brise pitanja, ali ne i snimke. Brisu se PRE naloga: ako
  // ne uspe, nalog ostaje i korisnik pokusava ponovo, umesto da snimak ostane
  // bez vlasnika. Skladista jos nema dok se pitanja.sql ne pokrene — tada nema
  // ni sta da se brise.
  const odgovori = admin.storage.from('odgovori');
  const { data: fajlovi, error: greskaListe } = await odgovori.list(data.user.id, { limit: 1000 });
  if (greskaListe && !/not.?found/i.test(greskaListe.message)) {
    console.error('spisak snimaka nije procitan', data.user.id, greskaListe.message);
    return json(500, { error: 'delete_failed' });
  }
  if (fajlovi && fajlovi.length > 0) {
    const { error: greskaBrisanja } = await odgovori.remove(fajlovi.map((f) => `${data.user.id}/${f.name}`));
    if (greskaBrisanja) {
      console.error('snimci nisu obrisani', data.user.id, greskaBrisanja.message);
      return json(500, { error: 'delete_failed' });
    }
  }

  // Bez drugog argumenta brisanje je trajno, ne "soft delete" — korisnik koji
  // trazi brisanje ocekuje da podataka vise nema, a to smo i napisali u
  // web/brisanje-naloga.html.
  const { error: greska } = await admin.auth.admin.deleteUser(data.user.id);
  if (greska) {
    console.error('brisanje naloga nije uspelo', data.user.id, greska.message);
    return json(500, { error: 'delete_failed' });
  }

  return json(200, { deleted: true });
});
