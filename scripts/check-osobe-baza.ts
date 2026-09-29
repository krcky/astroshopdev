/**
 * Druge osobe — `supabase/osobe.sql` u pravom Postgres-u (PGlite, kao
 * `check-pitanja-baza.ts`): ko sme sta (RLS) i granica broja osoba (1 besplatno,
 * 10 uz Premium), sa PRAVIM `ima_premium()` iz `pokloni.sql`.
 * Pokreni: npm run check:osobe-baza
 *
 * Proverava i da se brojke u bazi nisu razisle sa `src/lib/pristup.ts` — granicu
 * prikazuje aplikacija, a sprovodi baza (pravilo 8).
 */
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import path from 'node:path';

import { BESPLATNO, PREMIUM } from '../src/lib/pristup';

const KOREN = path.resolve(__dirname, '..');
const sql = (f: string) => fs.readFileSync(path.join(KOREN, 'supabase', f), 'utf8');

let fail = 0;
const ok = (c: unknown, label: string, detail = '') => {
  if (!c) fail++;
  console.log(`${c ? 'OK  ' : 'FAIL'}  ${label.padEnd(66)} ${detail}`);
};

async function main() {
  const db = new PGlite();

  // --- Supabase okruzenje, koliko fajlovi traze -------------------------------
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
  `);
  // `pokloni.sql` postavlja i paywall politike tabela sa tekstovima — zato i one. Njihove
  // politike vec pominju `ima_premium()`, pa do `pokloni.sql` stoji zamena koju on prepise.
  await db.exec(sql('schema.sql'));
  await db.exec(`create function public.ima_premium() returns boolean language sql stable as $$ select false $$;`);
  for (const f of ['transit-texts.sql', 'natal-texts.sql', 'pokloni.sql', 'osobe.sql']) await db.exec(sql(f));
  await db.exec(sql('osobe.sql')); // drugi put: fajl mora smeti da se pokrene ponovo

  const A = '00000000-0000-0000-0000-00000000000a';
  const B = '00000000-0000-0000-0000-00000000000b';
  await db.exec(`insert into auth.users values ('${A}','a@x.rs'),('${B}','b@x.rs');`);

  type Rez = { rows: any[]; e?: undefined } | { rows?: undefined; e: string };
  /** Upit kao korisnik `uid` (null = anon), kao sto ga salje PostgREST. */
  async function kao(uid: string | null, q: string): Promise<Rez> {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid ?? ''}', false); set role ${uid ? 'authenticated' : 'anon'};`);
    try { return { rows: (await db.query(q)).rows }; }
    catch (e) { return { e: (e as Error).message }; }
    finally { await db.exec('reset role;'); }
  }
  const vlasnik = async (q: string) => { await db.exec('reset role;'); return (await db.query(q)).rows as any[]; };
  const jedan = async (uid: string | null, q: string) => (await kao(uid, q)).rows?.[0] as any;
  const broj = async (uid: string | null) => (await jedan(uid, `select count(*)::int n from public.osobe`))?.n as number;

  let redni = 0;
  const dodaj = (uid: string, kome = uid, dodatno = '') => kao(uid,
    `insert into public.osobe (user_id, name, odnos, birth_year, birth_month, birth_day, city_name${dodatno ? ', birth_hour' : ''})
     values ('${kome}', 'Osoba ${++redni}', 'partner', 1990, 1, 1, 'Beograd'${dodatno ? `, ${dodatno}` : ''}) returning id`);

  console.log('\n1. Granica bez Premium-a');
  let x = await dodaj(A);
  const prva: string = x.rows?.[0]?.id;
  ok(prva, 'prva osoba prolazi', x.e);
  ok(/granica_osoba/.test((await dodaj(A)).e ?? ''), `druga odbijena (granica ${BESPLATNO.osobe})`);
  ok((await broj(A)) === BESPLATNO.osobe, 'baza i `BESPLATNO.osobe` se slazu', String(await broj(A)));

  console.log('\n2. Granica uz Premium (poklon, `ima_premium()`)');
  await vlasnik(`select admin.daj_premium('a@x.rs')`);
  let greska: string | undefined;
  while (!greska && (await broj(A)) < PREMIUM.osobe + 1) greska = (await dodaj(A)).e;
  ok(/granica_osoba/.test(greska ?? ''), 'posle granice odbijena');
  ok((await broj(A)) === PREMIUM.osobe, 'baza i `PREMIUM.osobe` se slazu', String(await broj(A)));
  await vlasnik(`update public.entitlements set active = false`);
  await vlasnik(`insert into public.entitlements (user_id, active) values ('${B}', true)`);
  ok((await dodaj(B)).e === undefined && (await dodaj(B)).e === undefined, 'placen Premium (entitlements) takodje podize granicu');

  console.log('\n3. Premium istekao — nista se ne brise');
  await vlasnik(`select admin.oduzmi_premium('a@x.rs')`);
  ok((await broj(A)) === PREMIUM.osobe, 'sve osobe ostaju');
  ok(/granica_osoba/.test((await dodaj(A)).e ?? ''), 'nova ne moze');
  x = await kao(A, `update public.osobe set name = 'Izmenjena' where id = '${prva}' returning name`);
  ok(x.rows?.[0]?.name === 'Izmenjena', 'izmena i dalje moze', x.e);
  x = await kao(A, `delete from public.osobe where id <> '${prva}' returning id`);
  ok(x.rows?.length === PREMIUM.osobe - 1, 'brisanje i dalje moze', x.e);
  ok((await dodaj(A)).e !== undefined, 'na granici besplatnog opet nema mesta');

  console.log('\n4. Tudje osobe');
  ok((await broj(B)) === 2, 'B vidi samo svoje');
  ok((await kao(B, `update public.osobe set name = 'x' where id = '${prva}' returning id`)).rows?.length === 0, 'B ne menja tudju');
  ok((await kao(B, `delete from public.osobe where id = '${prva}' returning id`)).rows?.length === 0, 'B ne brise tudju');
  ok(/row-level security/.test((await dodaj(B, A)).e ?? ''), 'B ne upisuje osobu na tudji nalog');
  ok(/row-level security/.test((await kao(A, `update public.osobe set user_id = '${B}' where id = '${prva}'`)).e ?? ''), 'osoba se ne prebacuje na drugi nalog');
  ok((await broj(null)) === 0, 'anon ne vidi nista');
  ok(/row-level security/.test((await kao(null, `insert into public.osobe (user_id, name, birth_year, birth_month, birth_day, city_name)
    values ('${A}', 'x', 1990, 1, 1, 'Beograd')`)).e ?? ''), 'anon ne upisuje');

  console.log('\n5. Oblik podataka');
  await vlasnik(`delete from public.osobe where user_id = '${A}'`);
  ok(/check/.test((await kao(A, `insert into public.osobe (user_id, name, odnos, birth_year, birth_month, birth_day, city_name)
    values ('${A}', 'x', 'komsija', 1990, 1, 1, 'Beograd')`)).e ?? ''), 'nepoznat odnos odbijen');
  ok(/osobe_time_is_whole/.test((await dodaj(A, A, '12')).e ?? ''), 'sat bez minuta odbijen');
  ok(/check/.test((await kao(A, `insert into public.osobe (user_id, name, birth_year, birth_month, birth_day, city_name)
    values ('${A}', '   ', 1990, 1, 1, 'Beograd')`)).e ?? ''), 'prazno ime odbijeno');
  ok(!(await kao(A, `insert into public.osobe (user_id, name, birth_year, birth_month, birth_day, city_name)
    values ('${A}', 'Bez odnosa', 1990, 1, 1, 'Beograd')`)).e, 'odnos nije obavezan');

  // Kljucevi odnosa u bazi = `ODNOSI` u aplikaciji.
  const { ODNOSI } = await import('../src/lib/osobe');
  const uBazi = /odnos in \(([^)]*)\)/.exec(sql('osobe.sql'))?.[1].match(/'([a-z_]+)'/g)?.map((s) => s.slice(1, -1)) ?? [];
  ok(uBazi.join(',') === ODNOSI.map((o) => o.key).join(','), 'odnosi u bazi = `ODNOSI`', uBazi.join(','));

  console.log('\n6. Brisanje naloga');
  await vlasnik(`delete from auth.users where id = '${A}'`);
  ok((await vlasnik(`select count(*)::int n from public.osobe where user_id = '${A}'`))[0]?.n === 0, 'brisanje naloga brise osobe');
  ok((await vlasnik(`select count(*)::int n from public.osobe where user_id = '${B}'`))[0]?.n === 2, 'tudje ostaju');

  await db.close();
  console.log(fail ? `\n${fail} PROVERA PALO` : '\nSve provere prosle.');
  process.exit(fail ? 1 : 0);
}

main();
