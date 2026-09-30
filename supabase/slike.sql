-- SLIKA PROFILA (Ivan, 29.9.2026) — korisnik izabere svoju sliku u profilu.
-- Kod: `src/lib/slika-profila.ts`. Putanja slike stoji u `auth.users.user_metadata.slika`
-- (korisnik je sam menja kroz `updateUser`), pa nova kolona ne treba.
--
-- PRIVATNO skladiste: slika se vidi samo preko potpisanog linka, a link moze da
-- napravi samo vlasnik (politika za citanje ispod). Putanja je
-- `<korisnik>/<vreme>.jpg`; aplikacija salje 512x512 JPEG (~50—100 KB), granica 2 MB.
--
-- Brisanje naloga brise i slike (`functions/delete-account`, pre naloga).
-- Pokrece se jednom u SQL Editoru; ponovno pokretanje nista ne kvari.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('slike', 'slike', false, 2097152, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Sve tri politike: SAMO u svom folderu. Prvi deo putanje je id korisnika.
-- Bez UPDATE politike — nova slika je nov fajl (vreme u imenu), stara se brise.
drop policy if exists "slike: vlasnik vidi svoje" on storage.objects;
create policy "slike: vlasnik vidi svoje" on storage.objects
  for select to authenticated
  using (bucket_id = 'slike' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "slike: vlasnik dodaje" on storage.objects;
create policy "slike: vlasnik dodaje" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'slike'
    and (storage.foldername(name))[1] = auth.uid()::text
    and name ~ ('^' || auth.uid()::text || '/[0-9]+\.jpg$')
  );

drop policy if exists "slike: vlasnik brise" on storage.objects;
create policy "slike: vlasnik brise" on storage.objects
  for delete to authenticated
  using (bucket_id = 'slike' and (storage.foldername(name))[1] = auth.uid()::text);
