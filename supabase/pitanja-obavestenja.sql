-- MEJL ASTROLOGU KAD STIGNE NOVO PITANJE (Ivan, 29.9.2026).
-- Pokreni u Supabase: SQL Editor -> New query -> nalepi ovo -> Run. Moze vise puta.
--
-- REDOSLED (inace okidac zove funkciju koje nema, a mejla nema):
--   1. `pitanja.sql` (kolona `obavesteno_at`)
--   2. SendGrid kljuc kao tajna i deploy funkcije — vidi zaglavlje
--      `supabase/functions/obavesti-astrologa/index.ts`
--   3. ovaj fajl
--
-- Kad pitanje predje u `paid` (kupovina ili kredit), baza preko `pg_net` pozove
-- funkciju `obavesti-astrologa` sa id-jem pitanja. Poziv je asinhron: ne usporava
-- i ne obara placanje, i kad mejl ne uspe. Da li je mejl poslat vidi se u koloni
-- `obavesteno_at` i u logu funkcije (Edge Functions -> obavesti-astrologa -> Logs).
--
-- Adresa funkcije je javna (kao i adresa projekta); sama funkcija salje mejl
-- samo za placeno pitanje, samo astrolozima i samo jednom.

create extension if not exists pg_net with schema extensions;

create or replace function public.obavesti_o_novom_pitanju()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform net.http_post(
    url := 'https://vwpmsqqwndsoakwhcmzt.supabase.co/functions/v1/obavesti-astrologa',
    body := jsonb_build_object('pitanje_id', new.id),
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  return new;
end;
$$;

revoke all on function public.obavesti_o_novom_pitanju() from public, anon, authenticated;

-- Nacrt -> placeno (kredit danas, webhook kupovine sutra).
drop trigger if exists pitanja_obavesti_izmena on public.pitanja;
create trigger pitanja_obavesti_izmena
  after update of status on public.pitanja
  for each row
  when (new.status = 'paid' and old.status is distinct from 'paid')
  execute function public.obavesti_o_novom_pitanju();

-- Pitanje upisano odmah kao placeno (danas nema takvog toka, ali da ne promakne).
drop trigger if exists pitanja_obavesti_upis on public.pitanja;
create trigger pitanja_obavesti_upis
  after insert on public.pitanja
  for each row
  when (new.status = 'paid')
  execute function public.obavesti_o_novom_pitanju();

-- Rucno ponovo, ako mejl nije stigao (npr. kljuc nije bio postavljen):
--   select net.http_post(
--     url := 'https://vwpmsqqwndsoakwhcmzt.supabase.co/functions/v1/obavesti-astrologa',
--     body := jsonb_build_object('pitanje_id', '<id pitanja>'::uuid));
