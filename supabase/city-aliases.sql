-- Alternativna imena gradova, radi PRETRAGE.
--
-- Zasto je ovo neophodno: GeoNames glavno ime je ENGLESKO — "Vienna",
-- "Munich", "Chicago". Nas korisnik kuca "Bec", "Minhen", "Cikago". Bez ovoga
-- pretraga dijaspore prakticno ne radi.
--
-- Srpska imena su u GeoNames-u cirilicom; presloveljena su u latinicu pri
-- pripremi fajla, istim presavijanjem koje aplikacija radi nad upitom.
--
-- Pokreni OVO, pa uvezi city-aliases.csv preko Table Editor -> Import CSV.

create table if not exists public.city_aliases (
  city_id     bigint not null references public.cities(id) on delete cascade,
  search_name text   not null,
  primary key (city_id, search_name)
);

create index if not exists city_aliases_search_idx
  on public.city_aliases (search_name text_pattern_ops);

alter table public.city_aliases enable row level security;

drop policy if exists "alijasi: svi mogu da citaju" on public.city_aliases;
create policy "alijasi: svi mogu da citaju" on public.city_aliases
  for select using (true);

-- Pretraga koja gleda i glavna imena i alijase.
-- Poseban upit po tabeli pa unija — tako oba indeksa mogu da se iskoriste.
create or replace function public.search_cities(q text, lim int default 8)
returns setof public.cities
language sql
stable
set search_path = public
as $$
  select c.*
  from public.cities c
  where c.id in (
    select id       from public.cities      where search_name like q || '%'
    union
    select city_id  from public.city_aliases where search_name like q || '%'
  )
  order by c.population desc
  limit lim;
$$;

do $$
begin
  raise notice 'OK: tabela city_aliases spremna, uvezi sada city-aliases.csv';
end $$;
