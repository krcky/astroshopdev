-- Tabela gradova za dijasporu — sve van regiona (region je ugradjen u aplikaciju).
-- Podaci: GeoNames cities5000, CC-BY 4.0, https://www.geonames.org/
--
-- Pokreni OVO PRVO, pa tek onda uvezi cities-world.csv preko
-- Table Editor -> cities -> Import data from CSV.

create table if not exists public.cities (
  -- GeoNames id. Isti kljuc koji aplikacija koristi za ugradjene gradove,
  -- pa se lokalni i mrezni rezultati nikad ne mogu pomesati.
  id           bigint primary key,
  name         text   not null,
  -- Ime bez dijakritika i malim slovima. Postoji da bi indeks mogao da radi:
  -- pretraga "zurich" mora da nadje "Zürich".
  search_name  text   not null,
  country_code text   not null,
  latitude     double precision not null,
  longitude    double precision not null,
  -- IANA zona, npr. "Europe/Vienna". Istorijske pomeraje racuna aplikacija
  -- preko Intl — GeoNames daje samo tekucu godinu.
  timezone     text   not null,
  population   integer not null default 0
);

-- Pretraga je uvek "pocinje sa", pa text_pattern_ops indeks radi posao.
create index if not exists cities_search_idx on public.cities (search_name text_pattern_ops);
create index if not exists cities_pop_idx    on public.cities (population desc);

alter table public.cities enable row level security;

-- Ovo je JAVNA referentna tabela: imena gradova nisu niciji podatak.
-- Citanje je dozvoljeno svima, ukljucujuci neprijavljene — onboarding se
-- odvija PRE nego sto nalog postoji.
drop policy if exists "gradovi: svi mogu da citaju" on public.cities;
create policy "gradovi: svi mogu da citaju" on public.cities
  for select using (true);

-- NEMA politike za upis. Podatke unosi samo vlasnik projekta, kroz uvoz CSV-a.

do $$
begin
  if not (select relrowsecurity from pg_class where relname = 'cities') then
    raise exception 'RLS NIJE UKLJUCEN na tabeli cities';
  end if;
  raise notice 'OK: tabela cities spremna, uvezi sada cities-world.csv';
end $$;
