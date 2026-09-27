-- Lunarni kalendar astrologa: 7 faza x 12 znakova x 5 oblasti = 420 tekstova (28.9.2026).
--
-- Deo korpusa, pa vazi isto sto i za `transit_texts` (pravilo 7): nikad u
-- aplikaciju — aplikacija trazi samo tekst za fazu i znak tog dana.
--
-- BESPLATNO (Ivan, 28.9.2026): cita svaki PRIJAVLJEN korisnik, neprijavljen
-- nista. Politike za upis NEMA — tekstove uvozi vlasnik iz CSV-a koji pravi
-- `scripts/korpus/lunarni.py` (lektura i ujednacene liste su vec primenjene).

create table if not exists public.lunar_texts (
  -- lunar.<faza>.<znak>.<oblast>, npr. lunar.full.taurus.basta. Ne menjati posle uvoza.
  key    text primary key,
  -- Isti kljucevi kao `LunarTextPhase` u moon.ts
  phase  text not null check (phase in
           ('new', 'waxing', 'first_quarter', 'full', 'waning_gibbous', 'last_quarter', 'waning_crescent')),
  -- SIGNS[].key iz zodiac.ts
  sign   text not null,
  area   text not null check (area in ('ljubav', 'zdravlje', 'karijera', 'kuca', 'basta')),
  -- Pasusi odvojeni praznim redom; stavke liste "• Naslov – tekst" (lib/tumacenje.ts).
  body   text not null
);

create index if not exists lunar_texts_phase_sign_idx on public.lunar_texts (phase, sign);

alter table public.lunar_texts enable row level security;

drop policy if exists "lunarni kalendar: svi prijavljeni" on public.lunar_texts;

create policy "lunarni kalendar: svi prijavljeni" on public.lunar_texts
  for select using (auth.uid() is not null);

-- NEMA politike za upis.

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.lunar_texts'::regclass) then
    raise exception 'RLS nije ukljucen na lunar_texts';
  end if;
  raise notice 'OK: tabela lunar_texts spremna, uvezi sada lunar-texts.csv';
end $$;
