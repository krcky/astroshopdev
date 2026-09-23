# AstroGlyphs.ttf

Nije preuzet gotov font nego je **sklopljen** iz dva izvora, jer nijedan sam
ne pokriva svih 27 znakova koje aplikacija crta:

| Izvor | Znakova | Koji |
|---|---:|---|
| Noto Sans Symbols | 24 | planete, zodijak, konjunkcija, opozicija, sekstil |
| Noto Sans Symbols 2 | 3 | ☉ Sunce, □ kvadrat, △ trigon |

Oba su SIL Open Font License 1.1 — slobodni za komercijalnu upotrebu i ugradnju.
Licenca je u `OFL.txt`.

Postupak (fontTools):

1. `varLib.instancer` fiksira varijabilni Noto Sans Symbols na `wght=400`
2. `pyftsubset` svaki font svede na svoje znakove
3. `fonttools merge` spaja u jedan fajl

Rezultat: **5,3 KB** umesto 1,6 MB koliko nose oba izvora zajedno.

Spisak znakova nije kucan rucno — izvucen je iz `src/lib/astro.ts` i
`src/lib/zodiac.ts`. Ako se doda novo telo (cvorovi ☊ ☋, Hiron, Lilit),
font treba ponovo sklopiti, jer novog znaka u njemu nema.
