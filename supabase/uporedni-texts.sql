-- Uporedni horoskop (poredjenje po znaku Sunca): do 144 USMERENA para x 3 oblasti (Ljubav, Prijateljstvo, Posao), 14.10.2026.
--
-- Tekstovi su sa astroshop.rs/uporedni-horoskop/<znak>-<znak>/ (javni), a ovde su da prate isti put kao ostali korpus:
-- na klijent ne ide sve odjednom (pravilo 7) — aplikacija trazi samo tekstove za JEDAN par (tri reda).
-- USMERENI: "ovan-bik" je tekst u kom je "vi" Ovan, a Bik je drugi; "bik-ovan" je drugi tekst. U aplikaciji je prvi znak
-- uvek korisnikov.
--
-- BESPLATNO (kao lunarni kalendar): cita svaki PRIJAVLJEN korisnik, neprijavljen nista. Politike za upis NEMA — uvoz radi
-- vlasnik iz `uvoz.sql` koji pravi `scripts/korpus/uporedni.py` (ne rucno), preko `supabase db query --linked`.
--
-- Kolona `jezik` je tu od pocetka (kao u `prevod-jezik.sql`): srpski je original, prevodi dolaze kao novi redovi.

create table if not exists public.uporedni_texts (
  -- uporedni.<prvi>.<drugi>.<oblast>, npr. uporedni.aries.taurus.ljubav. Ne menjati posle uvoza.
  key    text not null,
  jezik  text not null default 'sr' check (jezik in ('sr', 'hr', 'bs', 'en', 'sl', 'mk')),
  -- SIGNS[].key iz zodiac.ts: znak u kom je "vi" i znak druge osobe
  prvi   text not null,
  drugi  text not null,
  area   text not null check (area in ('ljubav', 'prijateljstvo', 'posao')),
  -- Pasusi odvojeni praznim redom.
  body   text not null,
  primary key (key, jezik)
);

create index if not exists uporedni_texts_par_idx on public.uporedni_texts (prvi, drugi, jezik);

comment on column public.uporedni_texts.jezik is
  'Jezik teksta: sr (original sa sajta), hr, bs, en, sl, mk. Primarni kljuc (key, jezik).';

alter table public.uporedni_texts enable row level security;

drop policy if exists "uporedni horoskop: svi prijavljeni" on public.uporedni_texts;

create policy "uporedni horoskop: svi prijavljeni" on public.uporedni_texts
  for select using (auth.uid() is not null);

-- NEMA politike za upis.

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.uporedni_texts'::regclass) then
    raise exception 'RLS nije ukljucen na uporedni_texts';
  end if;
  raise notice 'OK: tabela uporedni_texts spremna, uvezi sada uvoz.sql';
end $$;
