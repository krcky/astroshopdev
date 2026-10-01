# Prevod aplikacije — kako tekst ide kroz rečnik

Cilj prvog koraka (1.10.2026): sav tekst koji korisnik vidi je u rečniku `src/i18n/sr/`, a
aplikacija izgleda ISTO kao pre. Drugi jezici (hr, bs, sl, mk, en) su posle toga samo novi
rečnici iste oblike.

## Gde je šta

| Fajl | Šta |
|---|---|
| `src/i18n/jezik.ts` | tekući jezik, `tr()`, `registrujJezik`, spajanje sa srpskim. Čist modul (pravilo 6). |
| `src/i18n/use-t.ts` | `useT()` za komponente |
| `src/i18n/sr/index.ts` | srpski rečnik = OSNOVA i TIP (`Recnik`) svih jezika |
| `src/i18n/sr/opste.ts` | reči sa mnogo ekrana: Nastavi, Sačuvaj, Otkaži… |
| `src/i18n/sr/gramatika.ts` | množina (`dana`, `meseci`, `tranzita`, `mnozina`), `veliko`, `locale` za `Intl` |
| `src/i18n/sr/datum.ts` | imena dana i meseci, OBLIK datuma ("Uto, 29. sep 2026") |
| `src/i18n/sr/nebo.ts` | planete, tačke, aspekti, znakovi sa padežima, faze Meseca, `uZnaku` / `uZnak` |
| `src/i18n/sr/<deo>.ts` | po delu aplikacije: `onboarding`, `profil`, `pitaj`, `prica`, `danas`, `karta` |

## Pravila

1. **Tekst se ne piše u ekranu.** Komponenta: `const t = useT();` (iz `@/i18n`), pa
   `t.profil.naslov`. Van komponente (`lib/`, store, funkcija van crtanja): `tr()` iz
   `@/i18n/jezik`, pozvan U TRENUTKU kad tekst treba.
2. **Nikad preveden tekst u konstanti na nivou modula.** Modul se izvrši jednom, pre nego što
   se jezik postavi. Konstanta sa tekstom postaje funkcija ili getter
   (`get name() { return tr().nebo.tela[key]; }` — tako rade `SIGNS`, `BODIES`, `ASPECTS`, `POINTS`).
3. **Cela rečenica je jedna stavka.** Ako rečenica nosi promenljivu, stavka je funkcija:
   `trajeJos: (koliko: string) => \`Traje još ${koliko}\``. Ne lepiti delove u ekranu —
   drugi jezik ima drugi red reči.
4. **Gramatika iz rečnika:** množina `t.gramatika.dana(n)`, `meseci(n)`, `tranzita(n)`, a nova
   reč uz broj je funkcija u svom delu, preko `mnozina` iz `./gramatika`. Znak u padežu:
   `t.nebo.uZnaku(key)` ("u Lavu"), `t.nebo.uZnak(key)` ("u Lava"), ili
   `t.nebo.znaci[key].lokativ`. Ime planete: `.name` (getter) ili `t.nebo.tela[key]`.
5. **Datum samo kroz `lib/horoscope.ts`** (`datum`, `formatDate`, `opsegDatuma`…) — oni već čitaju rečnik.
6. **Tekst ostaje ISTI, znak po znak** (dijakritika, crte —/–, tačke, razmaci).
7. **Ključevi** su kratki, camelCase, srpski bez dijakritike; jedan pod-objekat po ekranu ili
   komponenti, sa komentarom koji fajl ga koristi. Komentar za prevodioca samo gde kontekst
   nije očigledan ("verzal", "mora u jedan red", "prvo lice — ide na karticu za deljenje").
8. **Šta je tekst za korisnika:** JSX tekst; `title`, `label`, `subtitle`, `placeholder`;
   `accessibilityLabel` / `accessibilityHint`; `Alert.alert`; tekst deljenja i obaveštenja;
   poruke greške koje se prikazuju; ime fajla koje korisnik vidi ("Astro Shop <dan>.png").
   **Nije:** komentari, `console.*`, ključevi, klase, putanje, kodovi grešaka, dev ekrani
   (`app/dev-*.tsx`), korpus astrologa i podaci sa sajta (`simbolika.ts`, `znak-opis-podaci.ts`,
   `traits.ts`) — to je sadržaj i prevodi se u drugom koraku.

## Provera

```bash
npm run check:prevod
```

Skener čita svaki fajl kao TypeScript stablo i pada na JSX tekst ili string sa srpskim slovom
van rečnika. String BEZ dijakritike ("Profil") ne vidi sam; `--svi` ispisuje i sve stringove sa
razmakom i velikim slovom, za ručni pregled.

## Šta je ostalo van rečnika (namerno)

- Nativni tekst: ime ispod ikonice (`app.json`), sistemski upiti za dozvole (`infoPlist`),
  kanal obaveštenja u Kotlinu i Swift modulima. Za njih Expo ima `locales` u `app.json`.
- Mejl sa kodom (Supabase šablon, jedan za sve) i panel astrologa (ostaje srpski).
