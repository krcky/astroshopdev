-- Astroshop — sema baze.
-- Pokreni u Supabase: SQL Editor -> New query -> nalepi ovo -> Run.
--
-- KLJUCNI PRINCIP: anon kljuc je javan i ugradjen u aplikaciju. Podatke NE
-- stiti tajnost kljuca nego Row Level Security. Svaka tabela mora imati
-- ukljucen RLS i eksplicitne politike, inace je citav sadrzaj javan.

-- ---------------------------------------------------------------------------
-- PROFILI — podaci o rodjenju iz kojih se racuna natalna karta
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null check (length(trim(name)) between 1 and 60),
  birth_year   int  not null check (birth_year between 1900 and 2100),
  birth_month  int  not null check (birth_month between 1 and 12),
  birth_day    int  not null check (birth_day between 1 and 31),
  -- NULL = korisnik ne zna tacno vreme rodjenja; app tada prelazi na Whole Sign
  birth_hour   int      check (birth_hour between 0 and 23),
  birth_minute int      check (birth_minute between 0 and 59),
  city_name    text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- sat i minut idu zajedno ili nijedan
  constraint time_is_whole check (
    (birth_hour is null and birth_minute is null) or
    (birth_hour is not null and birth_minute is not null)
  )
);

alter table public.profiles enable row level security;

drop policy if exists "profil: citaj svoj"  on public.profiles;
drop policy if exists "profil: kreiraj svoj" on public.profiles;
drop policy if exists "profil: menjaj svoj"  on public.profiles;

create policy "profil: citaj svoj"   on public.profiles
  for select using (auth.uid() = id);
create policy "profil: kreiraj svoj" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profil: menjaj svoj"  on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- Namerno NEMA delete politike: brisanje profila ide preko brisanja naloga.

-- ---------------------------------------------------------------------------
-- ENTITLEMENTS — da li korisnik ima placen pristup
-- ---------------------------------------------------------------------------
-- Ovo puni ISKLJUCIVO RevenueCat webhook, preko service_role kljuca na serveru.
-- Korisnik sme samo da CITA svoj red. Da postoji politika za upis, svako bi
-- sebi mogao da upise `active = true` i otkljuca app bez placanja.
create table if not exists public.entitlements (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  active     boolean not null default false,
  product_id text,
  -- za pretplate: kad istice. NULL za one-time kupovinu (vazi zauvek).
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.entitlements enable row level security;

drop policy if exists "entitlement: citaj svoj" on public.entitlements;
create policy "entitlement: citaj svoj" on public.entitlements
  for select using (auth.uid() = user_id);
-- NEMA insert/update/delete politike za korisnike. To je namerno.

-- ---------------------------------------------------------------------------
-- updated_at se odrzava sam
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists entitlements_touch on public.entitlements;
create trigger entitlements_touch before update on public.entitlements
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Provera: obe tabele moraju imati ukljucen RLS
-- ---------------------------------------------------------------------------
do $$
declare t record;
begin
  for t in
    select tablename from pg_tables
    where schemaname = 'public' and tablename in ('profiles','entitlements')
  loop
    if not (select relrowsecurity from pg_class where relname = t.tablename) then
      raise exception 'RLS NIJE UKLJUCEN na tabeli %', t.tablename;
    end if;
  end loop;
  raise notice 'OK: RLS ukljucen na profiles i entitlements';
end $$;
