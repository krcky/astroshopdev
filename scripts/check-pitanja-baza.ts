/**
 * Prava pristupa za "Pitaj astrologa" — `supabase/pitanja.sql` u pravom Postgres-u.
 * Pokreni: npm run check:pitanja-baza
 *
 * PGlite je Postgres preveden za Node (bez servera i bez Docker-a). Supabase-ovi
 * delovi koje fajl koristi — uloge `anon`/`authenticated`, `auth.uid()`, sema
 * `storage` — napravljeni su ovde u najmanjem obliku. Korisnik se "prijavljuje"
 * kao na Supabase-u: `set role authenticated` + `request.jwt.claim.sub`.
 *
 * Ovo NE zamenjuje proveru na pravom projektu posle pokretanja SQL-a (vidi
 * skill supabase-security: "ne verovati konzoli, poslati zahtev"), ali hvata
 * gresku u politici pre nego sto stigne tamo.
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

const KOREN = path.resolve(__dirname, '..');
const sql = (f: string) => fs.readFileSync(path.join(KOREN, 'supabase', f), 'utf8');

let fail = 0;
const ok = (c: unknown, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

async function main() {
  const db = new PGlite();

  // --- Supabase okruzenje, koliko pitanja.sql trazi ---------------------------
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

    create schema auth;
    grant usage on schema auth to anon, authenticated;
    create table auth.users (id uuid primary key, email text);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

    create schema storage;
    grant usage on schema storage to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
  `);
  await db.exec(sql('schema.sql'));
  await db.exec(sql('pitanja.sql'));
  await db.exec(sql('pitanja.sql')); // drugi put: fajl mora smeti da se pokrene ponovo

  const A = '00000000-0000-0000-0000-00000000000a';
  const B = '00000000-0000-0000-0000-00000000000b';
  const C = '00000000-0000-0000-0000-00000000000c';
  await db.exec(`insert into auth.users values ('${A}','a@x.rs'),('${B}','b@x.rs'),('${C}','boban@x.rs');`);

  type Rez = { rows: any[]; e?: undefined } | { rows?: undefined; e: string };
  /** Upit kao korisnik `uid` (null = anon), kao sto ga salje PostgREST. */
  async function kao(uid: string | null, q: string): Promise<Rez> {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
    try { return { rows: (await db.query(q)).rows }; }
    catch (e) { return { e: (e as Error).message }; }
    finally { await db.exec('reset role;'); }
  }
  /** Vlasnik iz SQL Editora. */
  const vlasnik = async (q: string) => { await db.exec('reset role;'); return (await db.query(q)).rows as any[]; };
  const jedan = async (uid: string | null, q: string) => (await kao(uid, q)).rows?.[0] as any;

  console.log('\n1. Nacrt');
  let x = await kao(A, `select public.sacuvaj_nacrt('Da li da promenim posao?', '{"ime":"A"}'::jsonb) as id`);
  const nacrt1: string = x.rows?.[0]?.id;
  ok(nacrt1, 'nacrt se pravi', x.e);
  ok((await jedan(A, `select public.sacuvaj_nacrt('  Izmenjeno  ', null) as id`))?.id === nacrt1, 'jedan nacrt po nalogu: drugi poziv menja isti red');
  const n = await jedan(A, `select tekst, status from public.pitanja`);
  ok(n?.tekst === 'Izmenjeno' && n?.status === 'draft', 'tekst obrezan, status draft');
  ok(/prazno_pitanje/.test((await kao(A, `select public.sacuvaj_nacrt('   ')`)).e ?? ''), 'prazno odbijeno');
  ok(/predugo_pitanje/.test((await kao(A, `select public.sacuvaj_nacrt(repeat('a', 501))`)).e ?? ''), '501 znak odbijen');
  ok(!(await kao(A, `select public.sacuvaj_nacrt(repeat('ž', 500))`)).e, '500 znakova sa dijakritikom prolazi');
  ok((await kao(A, `select public.sacuvaj_nacrt('x', to_jsonb(repeat('a', 50000)))`)).e, 'snimak koji nije objekat ili je prevelik odbijen');
  await kao(A, `select public.sacuvaj_nacrt('Da li da promenim posao?', '{"ime":"A"}'::jsonb)`);
  ok((await kao(null, `select public.sacuvaj_nacrt('anon')`)).e, 'bez naloga nema nacrta');
  // Supabase daje `anon` pravo na svaku novu funkciju — mora se oduzeti izricito.
  for (const f of [`sacuvaj_nacrt('x', null)`, `posalji_kreditom('${A}')`, `oznaci_procitano('${A}')`, `je_astrolog()`, `odgovori_na_pitanje('${A}', 'x', 1)`]) {
    ok(/permission denied for function/.test((await kao(null, `select public.${f}`)).e ?? ''), `anon nema pravo: ${f.split('(')[0]}`);
  }

  console.log('\n2. Korisnik ne pise status');
  ok(/permission denied/.test((await kao(A, `insert into public.pitanja (user_id, tekst, status) values ('${A}', 'x', 'paid')`)).e ?? ''), 'insert u pitanja zabranjen');
  ok(/permission denied/.test((await kao(A, `update public.pitanja set status = 'paid'`)).e ?? ''), 'update statusa zabranjen');
  ok(/permission denied/.test((await kao(A, `delete from public.pitanja`)).e ?? ''), 'brisanje zabranjeno');
  ok(/permission denied/.test((await kao(A, `insert into public.pitanja_krediti (user_id, razlog) values ('${A}', 'poklon')`)).e ?? ''), 'upis kredita zabranjen');
  ok(/permission denied/.test((await kao(A, `select admin.daj_pitanje('a@x.rs')`)).e ?? ''), 'admin funkcije nedostupne korisniku');

  console.log('\n3. Slanje kreditom');
  ok(/nema_kredita/.test((await kao(A, `select public.posalji_kreditom('${nacrt1}')`)).e ?? ''), 'bez kredita nema slanja');
  await vlasnik(`select admin.daj_pitanje(' A@X.rs ', 'proba')`);
  ok((await jedan(A, `select count(*)::int n from public.pitanja_krediti where iskoriscen_at is null`))?.n === 1, 'korisnik vidi svoj kredit');
  ok((await jedan(B, `select count(*)::int n from public.pitanja_krediti`))?.n === 0, 'B ne vidi tudji kredit');
  ok(/nema_nacrta/.test((await kao(B, `select public.posalji_kreditom('${nacrt1}')`)).e ?? ''), 'B ne salje A-ov nacrt');
  x = await kao(A, `select public.posalji_kreditom('${nacrt1}')`);
  ok(!x.e, 'A salje kreditom', x.e);
  const p = await jedan(A, `select status, placeno_kreditom, paid_at from public.pitanja where id = '${nacrt1}'`);
  ok(p?.status === 'paid' && p?.placeno_kreditom && p?.paid_at, 'pitanje je paid');
  ok(/nema_nacrta/.test((await kao(A, `select public.posalji_kreditom('${nacrt1}')`)).e ?? ''), 'ne salje se dvaput');
  ok((await jedan(A, `select count(*)::int n from public.pitanja_krediti where iskoriscen_at is null`))?.n === 0, 'kredit potrosen');
  const nacrt2: string = (await jedan(A, `select public.sacuvaj_nacrt('Drugo pitanje') as id`))?.id;
  ok(nacrt2 && nacrt2 !== nacrt1, 'posle slanja nov nacrt je nov red');

  console.log('\n4. Astrolog');
  ok((await jedan(B, `select count(*)::int n from public.pitanja`))?.n === 0, 'B ne vidi tudja pitanja');
  ok((await jedan(C, `select public.je_astrolog() j`))?.j === false, 'C pre dodavanja nije astrolog');
  ok((await jedan(C, `select count(*)::int n from public.pitanja`))?.n === 0, 'ne-astrolog ne vidi nista');
  await vlasnik(`select admin.dodaj_astrologa('boban@x.rs', 'Boban Vujović')`);
  ok((await jedan(C, `select public.je_astrolog() j`))?.j === true, 'C je astrolog');
  const vidi = (await kao(C, `select id from public.pitanja`)).rows ?? [];
  ok(vidi.length === 1 && vidi[0].id === nacrt1, 'astrolog vidi poslato, NE nacrt');
  ok(/permission denied/.test((await kao(C, `update public.pitanja set status = 'answered'`)).e ?? ''), 'astrolog ne menja tabelu direktno');

  console.log('\n5. Glasovni odgovor u skladistu');
  const put = `${A}/${nacrt1}.m4a`;
  const upisi = (uid: string, ime: string) => kao(uid, `insert into storage.objects (bucket_id, name) values ('odgovori', '${ime}')`);
  ok(/row-level security/.test((await upisi(B, put)).e ?? ''), 'ne-astrolog ne otprema');
  ok((await upisi(C, `${A}/${nacrt2}.m4a`)).e, 'nema otpremanja za nacrt');
  ok((await upisi(C, `${A}/${nacrt1}.wav`)).e, 'wav se ne prima (samo m4a, mp3, aac)');
  ok(!(await upisi(C, `${A}/${nacrt1}.aac`)).e, 'aac sa telefona se prima');
  ok((await upisi(C, `${B}/${nacrt1}.m4a`)).e, 'putanja mora biti vlasnikova');
  ok(/nema_fajla/.test((await kao(C, `select public.odgovori_na_pitanje('${nacrt1}', '${put}', 95)`)).e ?? ''), 'bez fajla nema odgovora');
  ok(!(await upisi(C, put)).e, 'astrolog otprema na pravu putanju');
  ok(!(await kao(C, `update storage.objects set owner = '${C}' where name = '${put}'`)).e, 'ponovno snimanje prepisuje');
  ok((await jedan(A, `select count(*)::int n from storage.objects`))?.n === 0, 'korisnik ne slusa pre nego sto je odgovoreno');
  ok(/nije_astrolog/.test((await kao(B, `select public.odgovori_na_pitanje('${nacrt1}', '${put}', 95)`)).e ?? ''), 'B ne odgovara');
  ok(/pogresna_putanja/.test((await kao(C, `select public.odgovori_na_pitanje('${nacrt1}', '${B}/${nacrt1}.m4a', 95)`)).e ?? ''), 'tudja putanja odbijena');
  ok(/pogresno_trajanje/.test((await kao(C, `select public.odgovori_na_pitanje('${nacrt1}', '${put}', 0)`)).e ?? ''), 'trajanje 0 odbijeno');
  x = await kao(C, `select public.odgovori_na_pitanje('${nacrt1}', '${put}', 95)`);
  ok(!x.e, 'astrolog odgovara', x.e);
  const o = await jedan(A, `select status, audio_putanja, audio_trajanje, odgovorio from public.pitanja where id = '${nacrt1}'`);
  ok(o?.status === 'answered' && o?.audio_putanja === put && o?.audio_trajanje === 95 && o?.odgovorio === C, 'korisnik vidi odgovor');
  ok(/pitanje_nije_otvoreno/.test((await kao(C, `select public.odgovori_na_pitanje('${nacrt1}', '${put}', 95)`)).e ?? ''), 'ne odgovara se dvaput');
  ok((await upisi(C, put)).e, 'posle odgovora nema novog otpremanja');
  ok((await jedan(A, `select procitano_at from public.pitanja where id = '${nacrt1}'`))?.procitano_at === null, 'nov odgovor nije procitan');
  await kao(B, `select public.oznaci_procitano('${nacrt1}')`);
  ok((await vlasnik(`select procitano_at from public.pitanja where id = '${nacrt1}'`))[0]?.procitano_at === null, 'B ne moze da oznaci tudji odgovor');
  await kao(A, `select public.oznaci_procitano('${nacrt2}')`);
  ok((await vlasnik(`select procitano_at from public.pitanja where id = '${nacrt2}'`))[0]?.procitano_at === null, 'nacrt bez odgovora se ne oznacava');
  ok(!(await kao(A, `select public.oznaci_procitano('${nacrt1}')`)).e, 'vlasnik oznacava procitano');
  const prvi = (await vlasnik(`select procitano_at from public.pitanja where id = '${nacrt1}'`))[0]?.procitano_at;
  ok(prvi, 'procitano upisano');
  await kao(A, `select public.oznaci_procitano('${nacrt1}')`);
  ok(String((await vlasnik(`select procitano_at from public.pitanja where id = '${nacrt1}'`))[0]?.procitano_at) === String(prvi), 'drugo otvaranje ne pomera datum');
  ok(/permission denied/.test((await kao(A, `update public.pitanja set procitano_at = null`)).e ?? ''), 'direktna izmena i dalje zabranjena');
  const slusa = (await kao(A, `select name from storage.objects`)).rows ?? [];
  ok(slusa.length === 1 && slusa[0].name === put, 'korisnik slusa svoj odgovor');
  ok((await jedan(B, `select count(*)::int n from storage.objects`))?.n === 0, 'B ne slusa tudji odgovor');
  const anon = await kao(null, `select count(*)::int n from storage.objects`);
  ok(anon.e || anon.rows?.[0]?.n === 0, 'anon ne slusa');
  ok((await vlasnik(`select public from storage.buckets where id = 'odgovori'`))[0]?.public === false, 'skladiste je privatno');

  console.log('\n6. Ponovno pokretanje sa starim, duzim pitanjem');
  // Pitanje od 800 znakova iz vremena granice od 1000 — fajl mora i dalje da prodje.
  await vlasnik(`alter table public.pitanja drop constraint pitanja_tekst_check`);
  await vlasnik(`insert into public.pitanja (user_id, tekst, status) values ('${B}', repeat('x', 800), 'paid')`);
  let ponovo: string | null = null;
  try { await db.exec(sql('pitanja.sql')); } catch (e) { ponovo = (e as Error).message; }
  ok(!ponovo, 'pitanja.sql prolazi i kad postoji starije pitanje od 800 znakova', ponovo ?? '');
  ok(/predugo_pitanje/.test((await kao(B, `select public.sacuvaj_nacrt(repeat('a', 501))`)).e ?? ''), 'posle toga nova pitanja i dalje do 500');
  await vlasnik(`delete from public.pitanja where user_id = '${B}'`);

  console.log('\n7. Mejl astrologu (okidac, pitanja-obavestenja.sql)');
  // `pg_net` u PGlite-u ne postoji: ista funkcija samo belezi poziv.
  await db.exec(`
    create schema if not exists net;
    create table if not exists net.pozivi (id serial primary key, url text, body jsonb);
    create or replace function net.http_post(url text, body jsonb default '{}', params jsonb default '{}',
      headers jsonb default '{}', timeout_milliseconds int default 5000) returns bigint
      language sql as $$ insert into net.pozivi (url, body) values (url, body) returning id::bigint $$;
  `);
  await db.exec(sql('pitanja-obavestenja.sql').replace(/create extension[^;]*;/i, ''));
  await db.exec(sql('pitanja-obavestenja.sql').replace(/create extension[^;]*;/i, '')); // i drugi put
  const pozivi = async () => (await vlasnik(`select body->>'pitanje_id' as id, url from net.pozivi order by id`)) as { id: string; url: string }[];
  const nacrtB: string = (await jedan(B, `select public.sacuvaj_nacrt('Pitanje od B') as id`))?.id;
  await kao(B, `select public.sacuvaj_nacrt('Pitanje od B, prepravljeno')`);
  ok((await pozivi()).length === 0, 'nacrt i izmena nacrta ne salju mejl');
  await vlasnik(`select admin.daj_pitanje('b@x.rs')`);
  await kao(B, `select public.posalji_kreditom('${nacrtB}')`);
  let p1 = await pozivi();
  ok(p1.length === 1 && p1[0].id === nacrtB, 'placeno pitanje salje TACNO jedan poziv, sa id-jem pitanja', String(p1.length));
  ok(/\/functions\/v1\/obavesti-astrologa$/.test(p1[0]?.url ?? ''), 'poziv ide na funkciju obavesti-astrologa');
  await vlasnik(`select admin.dodaj_astrologa('boban@x.rs', 'Boban Vujović')`);
  await kao(C, `insert into storage.objects (bucket_id, name) values ('odgovori', '${B}/${nacrtB}.m4a')`);
  await kao(C, `select public.odgovori_na_pitanje('${nacrtB}', '${B}/${nacrtB}.m4a', 30)`);
  ok((await pozivi()).length === 1, 'odgovor ne salje novi mejl');
  await vlasnik(`insert into public.pitanja (user_id, tekst, status) values ('${B}', 'upisano placeno', 'paid')`);
  ok((await pozivi()).length === 2, 'pitanje upisano odmah kao placeno takodje salje mejl');
  ok(/permission denied/.test((await kao(B, `update public.pitanja set obavesteno_at = null`)).e ?? ''), 'korisnik ne dira obavesteno_at');

  console.log('\n8. Uklanjanje i brisanje naloga');
  await vlasnik(`select admin.ukloni_astrologa('boban@x.rs')`);
  ok((await jedan(C, `select count(*)::int n from public.pitanja`))?.n === 0, 'uklonjen astrolog ne vidi nista');
  await vlasnik(`delete from auth.users where id = '${A}'`);
  ok((await vlasnik(`select count(*)::int n from public.pitanja where user_id = '${A}'`))[0]?.n === 0, 'brisanje naloga brise pitanja');
  ok((await vlasnik(`select count(*)::int n from public.pitanja_krediti where user_id = '${A}'`))[0]?.n === 0, 'i kredite');
  ok((await vlasnik(`select count(*)::int n from public.pitanja where user_id = '${B}'`))[0]?.n > 0, 'tudja pitanja ostaju');

  await db.close();
  console.log(fail ? `\n${fail} PROVERA PALO` : '\nSve provere prosle.');
  process.exit(fail ? 1 : 0);
}

main();
