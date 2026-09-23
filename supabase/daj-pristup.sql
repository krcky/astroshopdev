-- RUCNO DODELJIVANJE PLACENOG PRISTUPA — samo za testiranje.
--
-- U produkciji ovu tabelu puni ISKLJUCIVO RevenueCat webhook. Korisnici nemaju
-- politiku za upis, pa niko ne moze sebi da otkljuca pristup iz aplikacije.
-- Ovaj upit radi samo iz SQL Editora, koji ima privilegije koje aplikacija nema.

-- 1) Da li nalog uopste postoji
select id, email, created_at
from auth.users
where email = 'krcky43@gmail.com';

-- 2) Dodeli pristup (expires_at = null znaci "vazi zauvek")
insert into public.entitlements (user_id, active, product_id, expires_at)
select id, true, 'rucno-testiranje', null
from auth.users
where email = 'krcky43@gmail.com'
on conflict (user_id) do update
  set active     = true,
      product_id = 'rucno-testiranje',
      expires_at = null;

-- 3) Provera — mora vratiti jedan red sa active = true
select u.email, e.active, e.product_id, e.expires_at
from public.entitlements e
join auth.users u on u.id = e.user_id
where u.email = 'krcky43@gmail.com';
