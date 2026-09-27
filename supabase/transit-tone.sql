-- Rucna oznaka tona tranzita za karticu "Tvoj dan" (27.9.2026).
--
-- Upisuje je astrolog (kroz uvoz, kao i korpus) na KRATKOJ verziji. Prazno =
-- ton se u aplikaciji racuna po pravilu (`src/lib/tone.ts`) i oznacava kao
-- `rule`, da astrolog kasnije moze da ga pregleda i prepise.
--
-- Postojece RLS politike vaze i za ovu kolonu: kratku verziju cita svaki
-- prijavljen. Politike za upis NEMA i ne dodaje se.

alter table public.transit_texts
  add column if not exists tone text
  check (tone is null or tone in ('povoljno', 'izazovno', 'mesovito'));

do $$
begin
  raise notice 'OK: kolona transit_texts.tone postoji';
end $$;
