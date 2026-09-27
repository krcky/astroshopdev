-- Tumacenja NATALNE karte: planeta u znaku, planeta u kuci, aspekt (28.9.2026).
--
-- Deo korpusa, pa vazi isto sto i za `transit_texts` (pravilo 7): nikad u
-- aplikaciju, aplikacija trazi samo kljuceve iz karte korisnika.
--
-- Paywall je OVDE (pravilo 8). Besplatno je samo ono sto ima `free = true` —
-- Sunce, Mesec i podznak U ZNAKU (Ivan, 28.9.2026); sve ostalo trazi aktivan
-- red u `entitlements`. Kolonu postavlja `scripts/korpus/natal.py` (`besplatno`).
-- Neprijavljen korisnik ne dobija nista.

create table if not exists public.natal_texts (
  -- natal.sun.sign.aries | natal.sun.house.1 | natal.moon.square.sun
  -- Aspekt = 'natal.' + contentKey iz findAspects(). NE MENJATI posle uvoza.
  -- Aspekti su izmedju planeta i na ASCENDENT; na MC NE (Ivan, 28.9.2026).
  key       text primary key,
  kind      text not null check (kind in ('sign', 'house', 'aspect')),
  title     text not null,        -- "Sunce u Ovnu"
  subtitle  text,                 -- "Probojna dinamičnost"
  body      text not null,
  free      boolean not null default false
);

alter table public.natal_texts enable row level security;

drop policy if exists "besplatni: svi prijavljeni" on public.natal_texts;
drop policy if exists "ostalo: samo placen pristup" on public.natal_texts;

create policy "besplatni: svi prijavljeni" on public.natal_texts
  for select using (auth.uid() is not null and free);

create policy "ostalo: samo placen pristup" on public.natal_texts
  for select using (
    exists (
      select 1 from public.entitlements e
      where e.user_id = auth.uid()
        and e.active
        and (e.expires_at is null or e.expires_at > now())
    )
  );

-- NEMA politike za upis. Tekstove uvozi vlasnik iz files/natal-texts.csv
-- (truncate pa import — CSV je ceo korpus, ne dopuna).

do $$
begin
  if not (select relrowsecurity from pg_class where oid = 'public.natal_texts'::regclass) then
    raise exception 'RLS nije ukljucen na natal_texts';
  end if;
  raise notice 'OK: tabela natal_texts spremna, uvezi sada natal-texts.csv';
end $$;
