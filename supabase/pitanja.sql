-- PITAJ ASTROLOGA — pitanje, placanje, glasovni odgovor (29.9.2026).
-- Pokreni u Supabase: SQL Editor -> New query -> nalepi ovo -> Run.
-- Pokrece se POSLE schema.sql (koristi `public.touch_updated_at()`). Moze vise puta.
--
-- TOK
--   draft     korisnik je napisao pitanje (jedan nacrt po nalogu, `sacuvaj_nacrt`)
--   paid      placeno: kupovinom (RevenueCat webhook — jos ne postoji) ili kreditom
--             (`posalji_kreditom`). Tek tada ga astrolog vidi.
--   answered  astrolog je poslao glasovnu poruku (`odgovori_na_pitanje`)
--   refunded  prodavnica je vratila novac (webhook). Odgovor, ako postoji, ostaje.
--
-- ROKA NEMA (Ivan, 29.9.2026): "obicno za 2—3 radna dana" samo pise u aplikaciji.
-- Nema kolone za rok, statusa "kasni" ni kredita za zakasneli odgovor.
--
-- KO STA SME — isti princip kao `entitlements` (pravilo 8):
--   * korisnik CITA svoja pitanja i kredite; PISE samo kroz tri funkcije:
--     nacrt (tekst + snimak karte), slanje kreditom i "procitano". Status,
--     placanje i odgovor ne moze da upise, jer za tabele NEMA politike za upis.
--   * astrolog (tabela `astrolozi`) cita poslata pitanja — nikad nacrte — i
--     odgovara kroz `odgovori_na_pitanje`.
--   * sve ostalo (placanje, povracaj) upisuje server sa service_role kljucem.
--
-- ZVUK je u PRIVATNOM skladistu `odgovori`, putanja `<korisnik>/<pitanje>.m4a` (ili mp3/aac).
-- Aplikacija ga pusta preko potpisanog linka koji istice (`createSignedUrl`);
-- javnog linka nema. U bazi se cuva PUTANJA, ne link — link istice.
--
-- VLASNIK (samo iz SQL Editora; aplikacija ove funkcije ne moze da pozove):
--
--   select admin.dodaj_astrologa('boban@primer.rs', 'Boban Vujović');
--   select admin.ukloni_astrologa('boban@primer.rs');
--   select admin.daj_pitanje('prijatelj@gmail.com', 'probno');   -- kredit za jedno pitanje
--   select * from admin.spisak_pitanja;
--
-- Astrolog mora prvo da ima nalog: Authentication -> Users -> Add user -> Create
-- new user (email, "Auto Confirm User"). Panel prijavljuje kodom na taj email.

create schema if not exists admin;
revoke all on schema admin from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- ASTROLOZI — ko sme u panel
-- ---------------------------------------------------------------------------
create table if not exists public.astrolozi (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ime     text not null check (length(btrim(ime)) between 1 and 80),
  dodat   timestamptz not null default now()
);

alter table public.astrolozi enable row level security;

drop policy if exists "astrolog: citaj svoj red" on public.astrolozi;
create policy "astrolog: citaj svoj red" on public.astrolozi
  for select using (auth.uid() = user_id);
-- NEMA politike za upis. Upisuje vlasnik kroz `admin.dodaj_astrologa`.

-- Bez argumenta namerno (kao `ima_premium()`): funkcija zna samo za onoga ko pita.
create or replace function public.je_astrolog()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.astrolozi a where a.user_id = auth.uid());
$$;

-- `anon` izricito: Supabase svakoj novoj funkciji u `public` daje pravo i ulozi `anon`
-- (podrazumevana prava seme), pa `from public` samo po sebi to ne skida (29.9.2026).
revoke all on function public.je_astrolog() from public, anon;
grant execute on function public.je_astrolog() to authenticated;

-- ---------------------------------------------------------------------------
-- PITANJA
-- ---------------------------------------------------------------------------
create table if not exists public.pitanja (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  -- `char_length` broji znakove, kao brojac u aplikaciji.
  -- Granica je 500 (Ivan, 29.9.2026); nametnuta ispod, posle `create table`.
  tekst            text not null,
  status           text not null default 'draft'
                   check (status in ('draft', 'paid', 'answered', 'refunded')),
  -- Snimak karte u trenutku slanja (`src/lib/pitanja.ts`, `snimakKarte`): ime,
  -- podaci o rodjenju, planete, kuce, aspekti. Racuna ga aplikacija — isti kod
  -- koji korisnik vidi u tabu "Ti", pa astrolog gleda istu kartu.
  karta            jsonb check (karta is null or (jsonb_typeof(karta) = 'object' and octet_length(karta::text) <= 40000)),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  paid_at          timestamptz,
  answered_at      timestamptz,
  refunded_at      timestamptz,
  -- Kupovina (upisuje webhook). Jedna transakcija otvara TACNO jedno pitanje.
  transaction_id   text unique,
  product_id       text,
  -- Probna kupovina (sandbox) — i Apple-ovi recenzenti kupuju tako.
  sandbox          boolean not null default false,
  placeno_kreditom boolean not null default false,
  audio_putanja    text,
  audio_trajanje   int check (audio_trajanje is null or audio_trajanje between 1 and 900),
  odgovorio        uuid references auth.users(id) on delete set null,
  -- Kad je korisnik prvi put otvorio odgovor (`oznaci_procitano`). NULL uz snimak =
  -- nov odgovor: broj na tabu "Pitaj" i tackica u "Mojim pitanjima".
  procitano_at     timestamptz
);

-- Za bazu u kojoj je tabela vec napravljena pre ove kolone (29.9.2026).
alter table public.pitanja add column if not exists procitano_at timestamptz;

-- Kad je astrologu poslat mejl o ovom pitanju (`functions/obavesti-astrologa`,
-- okidac u `pitanja-obavestenja.sql`). NULL = jos nije; upisuje samo server.
alter table public.pitanja add column if not exists obavesteno_at timestamptz;

-- Pitanje do 500 znakova (Ivan, 29.9.2026; ranije 1000). `not valid`: vazi za nova i
-- menjana pitanja, a vec poslata duza ostaju kakva su (ne rusi pokretanje fajla).
alter table public.pitanja drop constraint if exists pitanja_tekst_check;
alter table public.pitanja add constraint pitanja_tekst_check
  check (char_length(btrim(tekst)) between 1 and 500) not valid;

-- Jedan nacrt po nalogu: odustao od placanja -> isti nacrt ceka, i webhook uvek
-- zna koji nacrt da otvori.
create unique index if not exists pitanja_jedan_nacrt on public.pitanja (user_id) where status = 'draft';
create index if not exists pitanja_korisnik on public.pitanja (user_id, created_at desc);
create index if not exists pitanja_za_astrologa on public.pitanja (status, paid_at);

alter table public.pitanja enable row level security;

drop policy if exists "pitanja: citaj svoja" on public.pitanja;
create policy "pitanja: citaj svoja" on public.pitanja
  for select using (auth.uid() = user_id);

drop policy if exists "pitanja: astrolog cita poslata" on public.pitanja;
create policy "pitanja: astrolog cita poslata" on public.pitanja
  for select using (status <> 'draft' and public.je_astrolog());

-- NEMA politike za upis, izmenu ni brisanje. Uz to i prava na tabeli su oduzeta,
-- da ni slucajno dodata politika ne otvori upis statusa.
revoke insert, update, delete on public.pitanja from anon, authenticated;

drop trigger if exists pitanja_touch on public.pitanja;
create trigger pitanja_touch before update on public.pitanja
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- KREDITI — placeno pitanje koje jos nije napisano
-- ---------------------------------------------------------------------------
-- Nastaje kad kupovina stigne a nacrta nema (da korisnik ne izgubi placeno), ili
-- kad ga vlasnik pokloni. Trosi se u `posalji_kreditom`.
create table if not exists public.pitanja_krediti (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  razlog         text not null check (razlog in ('kupovina_bez_nacrta', 'poklon')),
  napomena       text,
  transaction_id text unique,
  product_id     text,
  created_at     timestamptz not null default now(),
  iskoriscen_at  timestamptz,
  pitanje_id     uuid references public.pitanja(id) on delete set null
);

create index if not exists krediti_korisnik on public.pitanja_krediti (user_id) where iskoriscen_at is null;

alter table public.pitanja_krediti enable row level security;

drop policy if exists "krediti: citaj svoje" on public.pitanja_krediti;
create policy "krediti: citaj svoje" on public.pitanja_krediti
  for select using (auth.uid() = user_id);

revoke insert, update, delete on public.pitanja_krediti from anon, authenticated;

-- ---------------------------------------------------------------------------
-- FUNKCIJE ZA APLIKACIJU
-- ---------------------------------------------------------------------------
-- Greske su kratke reci (`nema_kredita`…) — aplikacija ih prevodi na srpski.

-- Cuva JEDINI nacrt korisnika (pravi ga ili prepravlja). Vraca njegov id.
create or replace function public.sacuvaj_nacrt(p_tekst text, p_karta jsonb default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  t   text := btrim(coalesce(p_tekst, ''));
  id_ uuid;
begin
  if uid is null then raise exception 'nema_naloga'; end if;
  if char_length(t) < 1 then raise exception 'prazno_pitanje'; end if;
  if char_length(t) > 500 then raise exception 'predugo_pitanje'; end if;

  insert into public.pitanja (user_id, tekst, karta)
  values (uid, t, p_karta)
  on conflict (user_id) where status = 'draft'
  do update set tekst = excluded.tekst, karta = excluded.karta
  returning id into id_;

  return id_;
end;
$$;

-- Salje nacrt astrologu na racun kredita. Sve ili nista: kredit i status u istoj
-- transakciji, pa dva brza dodira ne mogu da potrose dva kredita.
create or replace function public.posalji_kreditom(p_pitanje uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  k   uuid;
begin
  if uid is null then raise exception 'nema_naloga'; end if;

  perform 1 from public.pitanja
   where id = p_pitanje and user_id = uid and status = 'draft'
   for update;
  if not found then raise exception 'nema_nacrta'; end if;

  select id into k from public.pitanja_krediti
   where user_id = uid and iskoriscen_at is null
   order by created_at
   limit 1
   for update skip locked;
  if k is null then raise exception 'nema_kredita'; end if;

  update public.pitanja_krediti set iskoriscen_at = now(), pitanje_id = p_pitanje where id = k;
  update public.pitanja
     set status = 'paid', paid_at = now(), placeno_kreditom = true
   where id = p_pitanje;
end;
$$;

-- Odgovor je otvoren: brise oznaku "nov". Samo vlasnik, samo odgovoreno pitanje,
-- samo prvi put (kasnija otvaranja ne pomeraju datum).
create or replace function public.oznaci_procitano(p_pitanje uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.pitanja
     set procitano_at = now()
   where id = p_pitanje
     and user_id = auth.uid()
     and audio_putanja is not null
     and procitano_at is null;
$$;

revoke all on function public.sacuvaj_nacrt(text, jsonb) from public, anon;
revoke all on function public.posalji_kreditom(uuid) from public, anon;
revoke all on function public.oznaci_procitano(uuid) from public, anon;
grant execute on function public.sacuvaj_nacrt(text, jsonb) to authenticated;
grant execute on function public.posalji_kreditom(uuid) to authenticated;
grant execute on function public.oznaci_procitano(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- FUNKCIJA ZA ASTROLOGA (panel)
-- ---------------------------------------------------------------------------
-- Panel prvo otpremi zvuk u `odgovori/<korisnik>/<pitanje>.<ext>` (m4a, mp3, aac), pa zove ovo.
-- Fajl mora da postoji — inace bi korisnik dobio "odgovoreno" bez snimka.
create or replace function public.odgovori_na_pitanje(p_pitanje uuid, p_putanja text, p_trajanje int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  vlasnik uuid;
begin
  if not public.je_astrolog() then raise exception 'nije_astrolog'; end if;

  select user_id into vlasnik from public.pitanja
   where id = p_pitanje and status = 'paid'
   for update;
  if vlasnik is null then raise exception 'pitanje_nije_otvoreno'; end if;

  if p_putanja is null or p_putanja !~ ('^' || vlasnik::text || '/' || p_pitanje::text || '\.(m4a|mp3|aac)$') then
    raise exception 'pogresna_putanja';
  end if;
  if p_trajanje is null or p_trajanje not between 1 and 900 then
    raise exception 'pogresno_trajanje';
  end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'odgovori' and o.name = p_putanja) then
    raise exception 'nema_fajla';
  end if;

  update public.pitanja
     set status = 'answered', answered_at = now(),
         audio_putanja = p_putanja, audio_trajanje = p_trajanje, odgovorio = auth.uid()
   where id = p_pitanje;
end;
$$;

revoke all on function public.odgovori_na_pitanje(uuid, text, int) from public, anon;
grant execute on function public.odgovori_na_pitanje(uuid, text, int) to authenticated;

-- ---------------------------------------------------------------------------
-- SKLADISTE ZA GLASOVNE ODGOVORE — privatno
-- ---------------------------------------------------------------------------
-- 10 minuta AAC-a iz pregledaca je ~5—10 MB; granica 25 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('odgovori', 'odgovori', false, 26214400, array['audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Korisnik slusa SAMO snimak koji je odgovor na njegovo pitanje. Potpisan link
-- (`createSignedUrl`) moze da napravi samo onaj ko sme da procita fajl.
drop policy if exists "odgovori: korisnik slusa svoj" on storage.objects;
create policy "odgovori: korisnik slusa svoj" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'odgovori'
    and exists (
      select 1 from public.pitanja q
      where q.user_id = auth.uid() and q.audio_putanja = objects.name
    )
  );

drop policy if exists "odgovori: astrolog cita" on storage.objects;
create policy "odgovori: astrolog cita" on storage.objects
  for select to authenticated
  using (bucket_id = 'odgovori' and public.je_astrolog());

-- Astrolog upisuje samo na putanju otvorenog (placenog, neodgovorenog) pitanja.
drop policy if exists "odgovori: astrolog upisuje" on storage.objects;
create policy "odgovori: astrolog upisuje" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'odgovori'
    and public.je_astrolog()
    and exists (
      select 1 from public.pitanja q
      where q.status = 'paid'
        and objects.name ~ ('^' || q.user_id::text || '/' || q.id::text || '\.(m4a|mp3|aac)$')
    )
  );

-- Ponovno snimanje pre slanja prepisuje isti fajl (upload sa `upsert`).
drop policy if exists "odgovori: astrolog prepisuje" on storage.objects;
create policy "odgovori: astrolog prepisuje" on storage.objects
  for update to authenticated
  using (bucket_id = 'odgovori' and public.je_astrolog())
  with check (
    bucket_id = 'odgovori'
    and public.je_astrolog()
    and exists (
      select 1 from public.pitanja q
      where q.status = 'paid'
        and objects.name ~ ('^' || q.user_id::text || '/' || q.id::text || '\.(m4a|mp3|aac)$')
    )
  );

-- ---------------------------------------------------------------------------
-- FUNKCIJE ZA VLASNIKA — sema `admin`, API je ne izlaze
-- ---------------------------------------------------------------------------
create or replace function admin.dodaj_astrologa(email_astrologa text, ime text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(email_astrologa));
  if uid is null then
    raise exception 'Nema naloga sa emailom % — napravi ga u Authentication -> Users -> Add user', email_astrologa;
  end if;
  insert into public.astrolozi (user_id, ime) values (uid, btrim(ime))
  on conflict (user_id) do update set ime = excluded.ime;
  return format('OK: %s (%s) ima pristup panelu', ime, email_astrologa);
end;
$$;

create or replace function admin.ukloni_astrologa(email_astrologa text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from public.astrolozi a using auth.users u
   where u.id = a.user_id and lower(u.email) = lower(btrim(email_astrologa));
  get diagnostics n = row_count;
  return case when n = 0 then format('%s nije bio astrolog', email_astrologa)
              else format('OK: %s vise nema pristup panelu', email_astrologa) end;
end;
$$;

-- Poklon jednog pitanja (i za probu toka pre nego sto stigne placanje).
create or replace function admin.daj_pitanje(email_korisnika text, napomena text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(btrim(email_korisnika));
  if uid is null then
    raise exception 'Nema naloga sa emailom % — osoba mora prvo da se prijavi u aplikaciji', email_korisnika;
  end if;
  insert into public.pitanja_krediti (user_id, razlog, napomena) values (uid, 'poklon', napomena);
  return format('OK: %s ima jedno pitanje na poklon', email_korisnika);
end;
$$;

revoke all on function admin.dodaj_astrologa(text, text) from public, anon, authenticated;
revoke all on function admin.ukloni_astrologa(text) from public, anon, authenticated;
revoke all on function admin.daj_pitanje(text, text) from public, anon, authenticated;

create or replace view admin.spisak_pitanja as
  select u.email,
         q.status,
         left(q.tekst, 80) as pitanje,
         q.created_at, q.paid_at, q.answered_at,
         q.placeno_kreditom, q.sandbox, q.product_id
  from public.pitanja q
  join auth.users u on u.id = q.user_id
  order by q.created_at desc;

-- ---------------------------------------------------------------------------
-- Provera: RLS ukljucen na sve tri tabele
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['astrolozi', 'pitanja', 'pitanja_krediti'] loop
    if not (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relname = t) then
      raise exception 'RLS NIJE UKLJUCEN na tabeli %', t;
    end if;
  end loop;
  raise notice 'OK: RLS ukljucen na astrolozi, pitanja i pitanja_krediti';
end $$;
