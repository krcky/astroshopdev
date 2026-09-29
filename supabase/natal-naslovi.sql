-- NASLOVI natalnih tumacenja — BEZ teksta (Ivan, 28.9.2026).
--
-- Ekran "Ti" uz svaku planetu i aspekt pokazuje podnaslov astrologa
-- ("Lojalni i brizni kolekcionar uspomena") i kad je tekst zakljucan — kao
-- sajt. Politike na `natal_texts` placene redove ne salju besplatnom korisniku
-- uopste, pa naslovi idu kroz ovu funkciju: ona vraca key, title, subtitle i
-- free, a `body` NIKAD (pravilo 8 — skracen odgovor bez prava pristupa).
--
-- Cena: prijavljen korisnik moze, pogadjanjem kljuceva, da skupi sve naslove
-- korpusa (~500 kratkih redova). Tekstovi ostaju zakljucani. Najvise 80
-- kljuceva po pozivu — karta ih ima oko 45.
--
-- Pokrenuti jednom u SQL Editoru. Dok funkcija ne postoji, aplikacija radi
-- bez naslova (samo "u Raku", "u 2. kuci").

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
    and t.key = any(kljucevi);
$$;

revoke execute on function public.natal_naslovi(text[]) from public, anon;
grant execute on function public.natal_naslovi(text[]) to authenticated;
