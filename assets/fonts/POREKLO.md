# AstroGlyphs.ttf

Nije preuzet gotov font nego je **sklopljen** iz tri izvora, jer nijedan sam
ne pokriva svih 30 znakova koje aplikacija crta:

| Izvor | Znakova | Koji |
|---|---:|---|
| Noto Sans Symbols | 26 | planete, zodijak, konjunkcija, opozicija, sekstil, ☊ cvor, ⚸ Lilit |
| Noto Sans Symbols 2 | 3 | ☉ Sunce, □ kvadrat, △ trigon |
| Noto Sans Math | 1 | ⊗ Tacka srece |

Sva tri su SIL Open Font License 1.1 — slobodni za komercijalnu upotrebu i
ugradnju. Licenca je u `OFL.txt`.

## Kako se pravi

```
python3 -m venv .venv && .venv/bin/pip install fonttools brotli
.venv/bin/python scripts/font/build-astroglyphs.py
```

Spisak znakova se NE kuca rucno — skripta ga cita iz koda (`glyph: '...'` u
`src/lib/astro.ts`, `zodiac.ts` i `points.ts`), pa font i aplikacija ne mogu da
se raziđu. Ako znaka nema ni u jednom izvoru, skripta NE upisuje font nego
prijavi gresku: prazan pravougaonik na telefonu se inace primeti tek u prodaji.

Izvori se preuzimaju sa Noto repozitorijuma i kesiraju u `scripts/font/.izvori/`
(nije u git-u).

## Zasto se DOPUNJUJE, a ne sklapa iznova

Podrazumevano se u postojeci font dodaju samo znakovi kojih u njemu nema.
Razlog je konkretan: prvih 27 znakova je 2026. sklopljeno iz **varijabilnog**
Noto Sans Symbols-a instanciranog na `wght=400`, a sa Noto servera se danas
skida **staticki** Regular. Krive se razlikuju i do 0,3 em — ♋ ima cak i
drugaciji broj poteza. Sklapanje iznova bi zato tiho promenilo izgled 16 vec
postojecih simbola u celoj aplikaciji.

`--iznova` postoji za slucaj da se to jednom svesno pozeli. Skripta posle
sklapanja poredi obrise sa prethodnom verzijom i javlja svaku promenu.

## Ako se doda novo telo

Dodaj `glyph: '…'` u kod, pokreni skriptu, pogledaj sta je ispisala. Kiron (⚷)
i juzni cvor (☋) u fontu NE postoje — za njih bi bilo potrebno jos jedno
sklapanje.
