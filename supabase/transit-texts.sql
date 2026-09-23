-- Korpus tumacenja tranzita, pisan rukom od astrologa.
--
-- OVO JE NAJVREDNIJA IMOVINA PROJEKTA. Nikad ne sme u aplikaciju — svako ko
-- raspakuje .ipa izvukao bi ceo rad. Aplikacija trazi samo tekst za danas.
--
-- Paywall je OVDE, ne u aplikaciji. RLS politika dozvoljava kratku verziju
-- svakom prijavljenom korisniku, a dugu samo onome ko ima aktivan pristup.
-- Aplikacija ne moze da zaobidje ovo ni izmenom koda — server prosto ne salje.

create table if not exists public.transit_texts (
  -- Isti oblik koji generise transits.ts: transit.jupiter.square.natal.venus
  key        text not null,
  -- 'short' = dnevni horoskop, 'long' = detaljno tumacenje
  version    text not null check (version in ('short', 'long')),
  title      text,
  body       text,
  positive   text,
  challenge  text,
  advice     text,
  -- Duga verzija ima sekcije (Dugorocni efekti, Specificne sfere zivota...).
  -- Cuva se kao JSON tekst, ne jsonb — uvoz iz CSV-a je tako pouzdaniji.
  sections   text,
  primary key (key, version)
);

create index if not exists transit_texts_key_idx on public.transit_texts (key);

alter table public.transit_texts enable row level security;

drop policy if exists "kratka verzija: svi prijavljeni" on public.transit_texts;
drop policy if exists "duga verzija: samo placen pristup" on public.transit_texts;

-- Besplatno: kratka verzija, ali samo prijavljenima. Neprijavljen ne dobija nista.
create policy "kratka verzija: svi prijavljeni" on public.transit_texts
  for select using (auth.uid() is not null and version = 'short');

-- Placeno: duga verzija. Provera ide direktno nad tabelom entitlements,
-- koju korisnik ne moze da menja (nema politiku za upis).
create policy "duga verzija: samo placen pristup" on public.transit_texts
  for select using (
    version = 'long'
    and exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid()
        and e.active
        and (e.expires_at is null or e.expires_at > now())
    )
  );

-- NEMA politike za upis. Korpus unosi samo vlasnik, kroz uvoz CSV-a.

do $$
begin
  raise notice 'OK: tabela transit_texts spremna, uvezi sada transit-texts.csv';
end $$;
