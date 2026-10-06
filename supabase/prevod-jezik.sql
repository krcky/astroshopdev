-- =============================================================================
-- Kolona `jezik` u tabelama korpusa (prevod korpusa, 2./3.10.2026).
--
-- NAPISANO, NIJE POKRENUTO. Pokrece Ivan, tek kad odobri prevode
-- (izvestaj: ~/Desktop/Astroshop App/Prevod korpusa/IZVESTAJ.md).
--
-- Postojeci redovi postaju jezik = 'sr' (default) — nista se ne brise i ne menja.
-- Prevodi se zatim UVOZE kao NOVI redovi (CSV iz Prevod korpusa/<jezik>/ ima kolonu `jezik`).
-- RLS politike se ne menjaju: ne pominju kljuc, pa vaze za svaki jezik isto
-- (kratka/besplatni za prijavljene, duga/ostalo samo uz Premium — pravilo 8).
--
-- REDOSLED (da aplikacija ne pukne):
--   1. ovaj fajl (aplikacija i dalje radi: upiti bez filtera po jeziku dobijaju i prevode,
--      pa se PRE uvoza prevoda mora objaviti verzija aplikacije koja filtrira po jeziku,
--      ILI se prevodi uvoze tek posle te verzije — vidi IZVESTAJ.md, korak 2);
--   2. nova verzija aplikacije (upit trazi jezik aplikacije, rezerva 'sr');
--   3. uvoz prevoda.
-- =============================================================================

begin;

-- ---------------------------------------------------------------- transit_texts
alter table public.transit_texts
  add column if not exists jezik text not null default 'sr'
  check (jezik in ('sr', 'hr', 'bs', 'en', 'sl', 'mk'));

alter table public.transit_texts drop constraint if exists transit_texts_pkey;
alter table public.transit_texts add primary key (key, version, jezik);

drop index if exists transit_texts_key_idx;
create index if not exists transit_texts_key_jezik_idx on public.transit_texts (key, jezik);

-- `tone` (rucna oznaka astrologa) je osobina TRANZITA, ne jezika: cita se samo sa srpskog reda.
comment on column public.transit_texts.tone is
  'Rucna oznaka tona; vazi za kljuc bez obzira na jezik — cita se sa reda jezik = ''sr''.';
comment on column public.transit_texts.jezik is
  'Jezik teksta: sr (original astrologa), hr, bs, en, sl, mk. Primarni kljuc (key, version, jezik).';

-- ---------------------------------------------------------------- natal_texts
alter table public.natal_texts
  add column if not exists jezik text not null default 'sr'
  check (jezik in ('sr', 'hr', 'bs', 'en', 'sl', 'mk'));

alter table public.natal_texts drop constraint if exists natal_texts_pkey;
alter table public.natal_texts add primary key (key, jezik);

comment on column public.natal_texts.jezik is
  'Jezik teksta: sr (original astrologa), hr, bs, en, sl, mk. Primarni kljuc (key, jezik).';

-- ---------------------------------------------------------------- lunar_texts
alter table public.lunar_texts
  add column if not exists jezik text not null default 'sr'
  check (jezik in ('sr', 'hr', 'bs', 'en', 'sl', 'mk'));

alter table public.lunar_texts drop constraint if exists lunar_texts_pkey;
alter table public.lunar_texts add primary key (key, jezik);

comment on column public.lunar_texts.jezik is
  'Jezik teksta: sr (original astrologa), hr, bs, en, sl, mk. Primarni kljuc (key, jezik).';

-- ---------------------------------------------------------------- natal_naslovi
-- Nova verzija sa jezikom i rezervom na srpski: za svaki kljuc red na trazenom jeziku,
-- a ako ga nema — srpski. Stara potpisna (text[]) ostaje dok je stare verzije aplikacije zovu.
create or replace function public.natal_naslovi(kljucevi text[], jez text)
returns table (key text, title text, subtitle text, free boolean)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (t.key) t.key, t.title, t.subtitle, t.free
  from public.natal_texts t
  where auth.uid() is not null
    and cardinality(kljucevi) <= 80
    and t.key = any(kljucevi)
    and t.jezik in (jez, 'sr')
  order by t.key, (t.jezik = jez) desc;
$$;

revoke execute on function public.natal_naslovi(text[], text) from public, anon;
grant execute on function public.natal_naslovi(text[], text) to authenticated;

-- Stara funkcija: samo srpski (inace bi stara aplikacija dobila po vise redova za isti kljuc).
create or replace function public.natal_naslovi(kljucevi text[])
returns table (key text, title text, subtitle text, free boolean)
language sql
stable
security definer
set search_path = public
as $$
  select t.key, t.title, t.subtitle, t.free
  from public.natal_texts t
  where auth.uid() is not null
    and cardinality(kljucevi) <= 80
    and t.key = any(kljucevi)
    and t.jezik = 'sr';
$$;

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.transit_texts'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.natal_texts'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.lunar_texts'::regclass) then
    raise exception 'RLS nije ukljucen na tabeli korpusa';
  end if;
  raise notice 'OK: kolona jezik postoji u transit_texts, natal_texts, lunar_texts; postojeci redovi su sr';
end $$;

commit;
