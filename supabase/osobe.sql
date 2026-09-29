-- DRUGE OSOBE (Ivan, 29.9.2026): partner, dete, roditelj, prijatelj... Korisnik
-- unosi NJIHOVE podatke o rodjenju i vidi njihovu natalnu kartu i tranzite, i
-- pita astrologa o njima (`pitanja.osoba_id`).
--
-- Pokreni u Supabase: SQL Editor -> New query -> nalepi ovo -> Run.
-- REDOSLED: posle schema.sql i pokloni.sql (trazi `touch_updated_at` i
-- `ima_premium`), a PRE pitanja.sql (pitanje pamti o kojoj je osobi). Moze vise puta.
--
-- GRANICA — besplatno 1, Premium 10 (Ivan, 29.9.2026). Iste brojke su u
-- `src/lib/pristup.ts` (`BESPLATNO.osobe`, `PREMIUM.osobe`); `npm run
-- check:osobe-baza` proverava da se nisu razisle. Proverava je BAZA, okidacem —
-- aplikacija je samo prikazuje (pravilo 8). Kad Premium istekne, osobe se NE
-- brisu: aplikacija ostavi otvorenu prvu dodatu, ostale pod katancem. Izmena i
-- brisanje su uvek dozvoljeni.
--
-- Za razliku od `profiles`, korisnik osobu SME da obrise — to je deo funkcije,
-- ne brisanje naloga. Brisanjem naloga osobe nestaju same (`on delete cascade`).
--
-- Podaci o rodjenju su u ISTOM obliku kao u `profiles` (`src/lib/sync.ts` ih
-- prevodi istim kodom); karta se racuna na telefonu, server je ne vidi.

create table if not exists public.osobe (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Ime ili nadimak — ne mora biti pravo ime.
  name         text not null check (length(btrim(name)) between 1 and 60),
  -- Ko je ta osoba korisniku (`src/lib/osobe.ts`, `ODNOSI`). NULL = nije receno.
  odnos        text check (odnos in ('partner', 'dete', 'roditelj', 'brat_sestra', 'prijatelj', 'drugo')),
  birth_year   int  not null check (birth_year between 1900 and 2100),
  birth_month  int  not null check (birth_month between 1 and 12),
  birth_day    int  not null check (birth_day between 1 and 31),
  -- NULL = vreme rodjenja nije poznato; karta tada ide po Whole Sign-u (pravilo 5).
  birth_hour   int      check (birth_hour between 0 and 23),
  birth_minute int      check (birth_minute between 0 and 59),
  city_id      bigint,
  city_name    text not null,
  latitude     double precision,
  longitude    double precision,
  time_zone    text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint osobe_time_is_whole check (
    (birth_hour is null and birth_minute is null) or
    (birth_hour is not null and birth_minute is not null)
  )
);

-- Redosled = redosled dodavanja; "prva dodata" ostaje otvorena bez Premium-a.
create index if not exists osobe_korisnik on public.osobe (user_id, created_at);

alter table public.osobe enable row level security;

drop policy if exists "osobe: citaj svoje"   on public.osobe;
drop policy if exists "osobe: dodaj svoje"   on public.osobe;
drop policy if exists "osobe: menjaj svoje"  on public.osobe;
drop policy if exists "osobe: brisi svoje"   on public.osobe;

create policy "osobe: citaj svoje"  on public.osobe
  for select using (auth.uid() = user_id);
create policy "osobe: dodaj svoje"  on public.osobe
  for insert with check (auth.uid() = user_id);
-- `with check`: osoba ne moze da se "prebaci" na tudji nalog.
create policy "osobe: menjaj svoje" on public.osobe
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "osobe: brisi svoje"  on public.osobe
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- GRANICA BROJA OSOBA
-- ---------------------------------------------------------------------------
-- `ima_premium()` pita za `auth.uid()` — onoga ko upisuje, a politika iznad
-- garantuje da je to vlasnik reda. Greska je kratka rec; aplikacija je prevodi
-- (`src/lib/osobe.ts`, `porukaOsobe`).
--
-- Okidac se izvrsava PRE provere RLS-a. Zato tudji red (ili upis bez naloga)
-- ovde samo propusta dalje — odbice ga politika — da greska `granica_osoba` ne
-- bi odala koliko osoba ima tudji nalog. Vlasnik iz SQL Editora (bez naloga,
-- mimo RLS-a) granicu nema.
create or replace function public.osobe_granica()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  granica int := case when public.ima_premium() then 10 else 1 end;
begin
  if auth.uid() is distinct from new.user_id then return new; end if;
  -- Dva istovremena upisa istog naloga ne smeju oba da prodju granicu:
  -- drugi ceka da se prvi zavrsi, pa broji i njegov red.
  perform pg_advisory_xact_lock(hashtext('osobe:' || new.user_id::text));
  select count(*) into n from public.osobe where user_id = new.user_id;
  if n >= granica then raise exception 'granica_osoba'; end if;
  return new;
end;
$$;

revoke all on function public.osobe_granica() from public, anon, authenticated;

drop trigger if exists osobe_granica on public.osobe;
create trigger osobe_granica before insert on public.osobe
  for each row execute function public.osobe_granica();

drop trigger if exists osobe_touch on public.osobe;
create trigger osobe_touch before update on public.osobe
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Provera: RLS mora biti ukljucen
-- ---------------------------------------------------------------------------
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.osobe'::regclass) then
    raise exception 'RLS NIJE UKLJUCEN na tabeli osobe';
  end if;
  raise notice 'OK: RLS ukljucen na osobe';
end $$;
