-- Cuva koordinate i vremensku zonu UZ profil, umesto da se izvode iz grada.
-- Pokreni u Supabase SQL Editoru. Bezbedno vise puta.
--
-- Dva razloga:
--  1. Gradovi dijaspore dolaze iz tabele `cities`, ne iz ugradjene liste.
--     Bez ovoga se karta ne bi mogla izracunati bez mreze.
--  2. Karta korisnika ne sme da se pomeri ako GeoNames sutra ispravi
--     koordinate nekog grada.

alter table public.profiles
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists time_zone text;

comment on column public.profiles.latitude  is 'Geografska sirina mesta rodjenja, + sever.';
comment on column public.profiles.longitude is 'Geografska duzina mesta rodjenja, + istok.';
comment on column public.profiles.time_zone is 'IANA zona, npr. "Europe/Vienna". Istorijske pomeraje racuna aplikacija.';
