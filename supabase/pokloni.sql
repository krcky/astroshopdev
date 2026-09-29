-- POKLONJEN PREMIUM — vlasnik bira kome, bez placanja (28.9.2026).
-- Pokreni u Supabase: SQL Editor -> New query -> nalepi ovo -> Run.
-- Fajl sam prepravlja i paywall politike na `transit_texts` i `natal_texts`
-- (iste su i u njihovim fajlovima), pa se pokrece samo ovaj.
--
-- ZASTO POSEBNA TABELA, A NE RED U `entitlements`: tu tabelu puni RevenueCat
-- webhook. Kad poklonjeni korisnik nesto kupi pa otkaze, webhook bi upisao
-- `active = false` i obrisao poklon. Ovako webhook nikad ne dira poklone, a
-- premium vazi ako postoji kupovina ILI poklon.
--
-- ZASTO NE KOD U APLIKACIJI: Apple 3.1.1 zabranjuje otkljucavanje sadrzaja
-- sopstvenim kodovima. Za kampanje postoje kodovi prodavnica (Offer Codes).
--
-- KORISCENJE (samo iz SQL Editora; aplikacija ove funkcije ne moze da pozove):
--
--   select admin.daj_premium('prijatelj@gmail.com');                       -- zauvek
--   select admin.daj_premium('prijatelj@gmail.com', '2027-01-01', 'astrolog');
--   select admin.oduzmi_premium('prijatelj@gmail.com');
--   select * from admin.spisak_poklona;
--
-- Osoba mora prvo da napravi nalog u aplikaciji — do tada njen email ne postoji.

-- ---------------------------------------------------------------------------
-- TABELA
-- ---------------------------------------------------------------------------
create table if not exists public.pokloni (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  -- NULL = zauvek
  vazi_do    timestamptz,
  napomena   text,
  dato       timestamptz not null default now()
);

alter table public.pokloni enable row level security;

drop policy if exists "poklon: citaj svoj" on public.pokloni;
create policy "poklon: citaj svoj" on public.pokloni
  for select using (auth.uid() = user_id);
-- NEMA politike za upis — isto kao `entitlements`. Upisuje samo vlasnik,
-- kroz funkcije ispod, iz SQL Editora.

-- ---------------------------------------------------------------------------
-- JEDNA PROVERA ZA CEO PAYWALL
-- ---------------------------------------------------------------------------
-- Bez argumenta namerno: sa `uid` kao argumentom svako bi preko RPC-a mogao da
-- pita za tudji nalog. Ovako funkcija zna samo za onoga ko pita.
-- `security definer` da politike drugih tabela ne zavise od politika ove dve.
create or replace function public.ima_premium()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.entitlements e
    where e.user_id = auth.uid()
      and e.active
      and (e.expires_at is null or e.expires_at > now())
  ) or exists (
    select 1 from public.pokloni p
    where p.user_id = auth.uid()
      and (p.vazi_do is null or p.vazi_do > now())
  );
$$;

revoke all on function public.ima_premium() from public;
grant execute on function public.ima_premium() to authenticated;

-- ---------------------------------------------------------------------------
-- FUNKCIJE ZA VLASNIKA — u semi `admin`, koju API ne izlaze
-- ---------------------------------------------------------------------------
-- PostgREST izlaze samo `public` (i ono sto se rucno doda u Exposed schemas).
-- Uz to je `execute` oduzet svima, pa ni slucajno dodata sema ne otvara vrata.
create schema if not exists admin;
revoke all on schema admin from public, anon, authenticated;

create or replace function admin.daj_premium(
  email_korisnika text,
  do_datuma timestamptz default null,
  napomena text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(trim(email_korisnika));
  if uid is null then
    raise exception 'Nema naloga sa emailom % — osoba mora prvo da se prijavi u aplikaciji', email_korisnika;
  end if;

  insert into public.pokloni (user_id, vazi_do, napomena)
  values (uid, do_datuma, napomena)
  on conflict (user_id) do update
    set vazi_do = excluded.vazi_do,
        napomena = coalesce(excluded.napomena, public.pokloni.napomena),
        dato = now();

  return format('OK: %s ima premium %s', email_korisnika,
    case when do_datuma is null then 'zauvek' else 'do ' || to_char(do_datuma, 'DD.MM.YYYY.') end);
end;
$$;

create or replace function admin.oduzmi_premium(email_korisnika text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
begin
  delete from public.pokloni p
  using auth.users u
  where u.id = p.user_id and lower(u.email) = lower(trim(email_korisnika));
  get diagnostics n = row_count;
  if n = 0 then
    return format('%s nije imao poklonjen premium', email_korisnika);
  end if;
  -- Placeni premium (entitlements) se ovde NE dira.
  return format('OK: poklon oduzet za %s', email_korisnika);
end;
$$;

revoke all on function admin.daj_premium(text, timestamptz, text) from public, anon, authenticated;
revoke all on function admin.oduzmi_premium(text) from public, anon, authenticated;

create or replace view admin.spisak_poklona as
  select u.email,
         p.vazi_do,
         (p.vazi_do is null or p.vazi_do > now()) as aktivan,
         p.napomena,
         p.dato
  from public.pokloni p
  join auth.users u on u.id = p.user_id
  order by p.dato desc;

revoke all on admin.spisak_poklona from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- PAYWALL POLITIKE — isto kao u transit-texts.sql i natal-texts.sql
-- ---------------------------------------------------------------------------
drop policy if exists "duga verzija: samo placen pristup" on public.transit_texts;
create policy "duga verzija: samo placen pristup" on public.transit_texts
  for select using (version = 'long' and public.ima_premium());

drop policy if exists "ostalo: samo placen pristup" on public.natal_texts;
create policy "ostalo: samo placen pristup" on public.natal_texts
  for select using (public.ima_premium());

-- ---------------------------------------------------------------------------
-- Provera
-- ---------------------------------------------------------------------------
do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.pokloni'::regclass) then
    raise exception 'RLS nije ukljucen na pokloni';
  end if;
  if has_function_privilege('anon', 'admin.daj_premium(text, timestamptz, text)', 'execute')
     or has_function_privilege('authenticated', 'admin.daj_premium(text, timestamptz, text)', 'execute') then
    raise exception 'admin.daj_premium je dostupna aplikaciji — ne sme biti';
  end if;
  raise notice 'OK: pokloni spremni, paywall pita ima_premium()';
end $$;
