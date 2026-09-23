-- Dodaje city_id na postojecu tabelu `profiles`.
-- Pokreni u Supabase SQL Editoru. Bezbedno je pokrenuti vise puta.
--
-- Zasto: profil je grad cuvao po IMENU, a 53 imena se u regionu ponavljaju.
-- Dva razlicita "Novo Selo" imaju razlicite koordinate, pa i razlicit
-- ascendent. Kljuc postaje GeoNames id.

alter table public.profiles
  add column if not exists city_id bigint;

comment on column public.profiles.city_id is
  'GeoNames id grada rodjenja. Izvor istine za koordinate i vremensku zonu.';
comment on column public.profiles.city_name is
  'Ime grada u trenutku unosa. Samo za prikaz — koordinate se citaju preko city_id.';
