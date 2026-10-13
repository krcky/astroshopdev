-- KARTICE PLANETA na natalnoj karti (Ivan, 13.10.2026): naslov, podnaslov i PRVA RECENICA tumacenja.
--
-- Probna verzija 2 strane "Ti" na kartici svake planete pokazuje prvu recenicu tumacenja astrologa —
-- i kad je tekst zakljucan (Ivan: "rečenica za sve"). Politike na `natal_texts` placene redove ne salju
-- besplatnom korisniku uopste, pa recenica ide kroz ovu funkciju, kao naslovi kroz `natal_naslovi`:
-- vraca key, title, subtitle, free i `recenica`, a ceo `body` NIKAD (pravilo 8 — skracen odgovor bez
-- prava pristupa).
--
-- Cena: prijavljen korisnik moze, pogadjanjem kljuceva, da skupi prvu recenicu svakog tumacenja
-- (~500 recenica). Ostatak teksta ostaje zakljucan. Najvise 80 kljuceva po pozivu — karta ih ima oko 45.
--
-- Pokrenuti jednom u SQL Editoru, POSLE `prevod-jezik.sql` (kolona `jezik`). Dok funkcija ne postoji,
-- aplikacija zove `natal_naslovi` i kartice su bez recenice — nije greska.

-- Prva recenica: do prve tacke, upitnika ili uzvicnika iza kojih ide razmak i VELIKO slovo (ili kraj).
-- "npr. nesto" se zato ne sece. Ako se kraj ne nadje, prvih 200 znakova.
create or replace function public.prva_recenica(t text)
returns text
language sql
immutable
set search_path = public
as $$
  select coalesce(
    substring(btrim(t) from '^(.+?[.!?])(?=\s+[[:upper:]„"“(]|\s*$)'),
    left(btrim(t), 200)
  );
$$;

create or replace function public.natal_kartice(kljucevi text[], jez text)
returns table (key text, title text, subtitle text, free boolean, recenica text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct on (t.key) t.key, t.title, t.subtitle, t.free, public.prva_recenica(t.body)
  from public.natal_texts t
  where auth.uid() is not null
    and cardinality(kljucevi) <= 80
    and t.key = any(kljucevi)
    and t.jezik in (jez, 'sr')
  order by t.key, (t.jezik = jez) desc;
$$;

revoke execute on function public.natal_kartice(text[], text) from public, anon;
grant execute on function public.natal_kartice(text[], text) to authenticated;
