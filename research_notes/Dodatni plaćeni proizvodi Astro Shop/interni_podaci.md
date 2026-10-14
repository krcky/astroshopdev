# Internal inventory: what Astro Shop already has (data, computation, texts) and what each candidate paid product still needs

Scope: internal research on the repository `/home/user/astroshopdev` (state 14.10.2026). Sources are repo files cited as `path:line`. Numbers marked **[run]** come from a throwaway script that imported the real `src/lib` code. The script and its output are in the session scratchpad: `/tmp/claude-0/-home-user-astroshopdev/2a7c647a-4717-5510-815b-a1049b412c75/scratchpad/inv/godina.ts` and `godina-out.txt`, plus `promene-2027.json`. The repo has no `node_modules`, so `src/` was copied into the scratchpad and `astronomy-engine@2.1.19` (the version in `package.json`) and `tsx` were installed there. Run with `TZ=Europe/Belgrade`. No repo file was modified. Anything marked **[estimate]** is my estimate, not a fact from code.

---

## 1. COMPUTATION: which astrological calculations exist, and which are missing but easy

### Takeaway
The app already computes, on the device and in pure testable functions, everything a year report needs: natal chart (Placidus with Whole Sign fallback, ASC/MC), day-by-day transits with orbs, exact-day detection and pass windows, sign ingresses, retrograde stations, Moon phases, lunar days, void-of-course Moon, planetary hours, sunrise/sunset, true node, mean Lilith and Part of Fortune. Not implemented: eclipses, solar return chart, progressions, synastry, composite chart, planetary-return finder, astrocartography and Chiron. All except Chiron and astrocartography are small jobs, because astronomy-engine 2.1.19 already has the eclipse searches (verified working) and the rest reuse `bodyLongitude`, `buildNatalChart` and `ASPECTS`.

### Cited findings
**Existing calculations**
- Ephemeris: 10 bodies (Moon, Sun, Mercury…Pluto) in `BODIES`. Longitudes are true ecliptic of date (ECT via `Rotation_EQJ_ECT`) with aberration. `planetPositions()` returns longitude, sign, speed in °/day and a retrograde flag. — [src/lib/astro.ts:32-43, 46-50, 78-96](/home/user/astroshopdev/src/lib/astro.ts)
- Natal aspects: 5 Ptolemaic aspects with natal orbs (conjunction 8, sextile 4, square 6, trine 6, opposition 8). `findAspects()` produces deterministic keys `a.aspect.b` in `BODIES` order. — [src/lib/astro.ts:112-118, 140-171](/home/user/astroshopdev/src/lib/astro.ts)
- Houses: ASC, MC, RAMC, Placidus intermediate cusps (iterative), Whole Sign, and an automatic fallback to Whole Sign at polar latitudes (`fellBack`). `houseOf()`, `buildNatalChart()`. — [src/lib/natal.ts:43-63, 74-109, 121-166, 169-208](/home/user/astroshopdev/src/lib/natal.ts)
- Unknown birth time: noon is used, Whole Sign, `timeUnknown` flag; ASC/MC are excluded as targets. — [src/store/profile.ts:129-155](/home/user/astroshopdev/src/store/profile.ts); [docs/ASTRO-LOGIKA.md:31-37](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
- Local birth time to UTC using historical zone rules, plus `isOffsetReliable()`. — [src/lib/timezone.ts:138-167, 192](/home/user/astroshopdev/src/lib/timezone.ts)
- Transits to the natal chart:
  - Targets are 10 planets plus ASC and MC. — [src/lib/transits.ts:43-50](/home/user/astroshopdev/src/lib/transits.ts)
  - `TRANSIT_ORB` is 3° (sextile 2°). — [src/lib/transits.ts:31-33](/home/user/astroshopdev/src/lib/transits.ts)
  - `findTransits()` builds keys `transit.<planet>.<aspect>.natal.<target>`. — [src/lib/transits.ts:70-104](/home/user/astroshopdev/src/lib/transits.ts)
  - `findHouseTransits()` builds keys `transit.X.in.house.N`. — [src/lib/transits.ts:115-124](/home/user/astroshopdev/src/lib/transits.ts)
- List orb: `LISTA_ORB` equals `TRANSIT_ORB` for every planet. `trajanjeTranzita()` is the only function that computes duration for display; it calls `tvojDanWindow()` with the list orb. — [src/lib/oblasti.ts:140, 153-157](/home/user/astroshopdev/src/lib/oblasti.ts)
- Duration and passes:
  - `dayStatus()` checks two consecutive midnights. A sign change of the signed distance is an "exact" crossing that day. — [src/lib/tvoj-dan.ts:113-124](/home/user/astroshopdev/src/lib/tvoj-dan.ts)
  - `tvojDanWindow()` walks day by day up to 1100 days back and forward and returns only the CURRENT pass through orb; a retrograde return is a new pass. — [src/lib/tvoj-dan.ts:256, 262-296](/home/user/astroshopdev/src/lib/tvoj-dan.ts); [docs/ASTRO-LOGIKA.md:82](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
  - An older `transitEnd()` uses 5-day steps with a 1100-day horizon. — [src/lib/transits.ts:484](/home/user/astroshopdev/src/lib/transits.ts)
- Exact-day detection: `exactDayKeys()` marks a day as exact when the orb at local midnight is ≤ the orb the day before and the day after, and ≤ 1.5°. — [src/lib/transits.ts:275](/home/user/astroshopdev/src/lib/transits.ts)
- `aktivniTranziti(chart, date, timeUnknown, orbZa)` returns every transit active that local day, with fields:
  - `exact` and `distance`
  - transit house and natal house
  - ruler role
  - strength (`jacina`)
  - Moon excluded via `INCLUDE_MOON_TRANSITS = false`
  
  Source: [src/lib/oblasti.ts:163-205](/home/user/astroshopdev/src/lib/oblasti.ts); [src/lib/oblasti-config.ts:107](/home/user/astroshopdev/src/lib/oblasti-config.ts)
- "Tvoj dan" scoring:
  - own orbs: 1.5°, Uranus–Pluto 1°, Moon 0
  - weights: planet × aspect × target, ×1.3 for key points and the ruler
  - rest periods: 3 days for fast planets, 7 for slow
  
  Source: [src/lib/tvoj-dan.ts:37-63](/home/user/astroshopdev/src/lib/tvoj-dan.ts)
- Moon transits of the day: `moonDay()` finds aspects that become exact between two local midnights. — [src/lib/transits.ts:559](/home/user/astroshopdev/src/lib/transits.ts)
- Sign ingresses and stations:
  - `upcomingSkyEvents()`: first next event per planet (ingress, retrograde, direct), with the end of the period and the Whole Sign house from ASC. Search window 400 days, end horizon 1100 days. — [src/lib/sky-events.ts:29-31, 105-160](/home/user/astroshopdev/src/lib/sky-events.ts)
  - `scripts/korpus/promene-godine.ts` lists every `sky.<planet>.sign|retrograde.<sign>` event in any 365-day window (6 h step, bisection). — [scripts/korpus/promene-godine.ts:1-60](/home/user/astroshopdev/scripts/korpus/promene-godine.ts)
- Moon:
  - `moonState`, `phaseDay()` (7 text phases, exact moment of the main phase, next main phase). — [src/lib/moon.ts:240-280](/home/user/astroshopdev/src/lib/moon.ts)
  - `lunationHouse()`: natal house of a New or Full Moon; Placidus only with a known birth time. — [src/lib/moon.ts:282-291](/home/user/astroshopdev/src/lib/moon.ts)
  - Plant part by element. — [src/lib/moon.ts:70-74](/home/user/astroshopdev/src/lib/moon.ts)
  - Monthly lunar calendar grid and main phases by day. — [src/lib/lunarni-kalendar.ts:24, 40](/home/user/astroshopdev/src/lib/lunarni-kalendar.ts)
- Astrodial (watch) math, already in `src/lib` as the source of truth:
  - `moonNow()`: sign, degree, entry/exit times, lunar day 1–30.
  - `voidOfCourse()`: last exact major aspect to 9 planets until the sign ingress.
  - `planetaryHour()`: Chaldean order, day starts at sunrise via `Astronomy.SearchRiseSet`, returns sunrise and sunset.
  - `upcomingEvents()`: 30 days of Moon sign changes, VOC, quarters, ingresses, stations.
  - Definitions await the astrologer.
  
  Source: [src/lib/sat.ts:47, 77, 115, 162, 208](/home/user/astroshopdev/src/lib/sat.ts); [docs/ASTRO-LOGIKA.md:340-349](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
- Derived points: true node from the Moon's angular momentum vector (`trueNodeLongitude`), mean Lilith, Part of Fortune with a day/night formula. They are deliberately NOT in `BODIES`, so they are not transit targets and have no texts. — [src/lib/points.ts:9-16, 55, 112, 133, 164](/home/user/astroshopdev/src/lib/points.ts); CLAUDE.md rule 16
- Sun-sign comparison: `ocenaPara()`. The 12×12 table from the website depends only on sign distance: 0/2/4/6 favourable, 1/5 less, 3 unfavourable. — [src/lib/uporedni.ts:20-37](/home/user/astroshopdev/src/lib/uporedni.ts)
- Solar return: only `daysToSolarReturn()`, an approximate day count (degrees / 0.9856), not a moment and not a chart. — [src/lib/transits.ts:127-132](/home/user/astroshopdev/src/lib/transits.ts)
- Rulers: traditional rulers are used for "Tvoj dan" (`signRulers`, `chartRulers`). — [src/lib/rulers.ts:19, 33, 45](/home/user/astroshopdev/src/lib/rulers.ts)
- Life wheel: 8 areas mapped to houses and planets; rating 1–5; state from a 3-day average. — [src/lib/krug-config.ts:26-47](/home/user/astroshopdev/src/lib/krug-config.ts)
- Native ports: the same math exists in Swift (`native/SkyCore`) and Kotlin, checked against a 52-moment golden file. — CLAUDE.md rule 27

**Not implemented (grep found no use in `src/` or `scripts/`)**
- Eclipses: no use of `SearchLunarEclipse` or `SearchGlobalSolarEclipse` anywhere in `src`. The C source in `native/SkyCore/Sources/CAstronomy/astronomy.c:11704` contains them, but nothing calls them.
- The installed astronomy-engine 2.1.19 exports `SearchLunarEclipse`/`NextLunarEclipse`, `SearchGlobalSolarEclipse`/`NextGlobalSolarEclipse`, `SearchLocalSolarEclipse`/`NextLocalSolarEclipse`, `SearchMoonNode`, `SearchPlanetApsis`, `SearchSunLongitude`, `SearchRelativeLongitude`, `SearchMaxElongation`, `SearchTransit` and `Seasons`. — **[run]** `node -e` export listing
- Eclipse search works with this version. **[run]** 2027 results:
  - Solar: annular 6.2.2027 (Sun at 317.6° = 17°36′ Aquarius); total 2.8.2027 (129.9° = 9°54′ Leo). From Belgrade, 2.8.2027 at 09:23 UTC is a partial eclipse with 56% obscuration.
  - Lunar: penumbral on 20.2 (Moon at 152.0°), 18.7 (296.0°) and 17.8.2027 (324.1°).
- Solar return moment: about 50 lines of bisection over `bodyLongitude('sun')`. **[run]** Gives 15.6.2027 11:03 UTC for the Belgrade sample; the SR chart is then `buildNatalChart()` at that moment. The repo convention is its own bisection, not library search functions, so all three ports stay the same algorithm. — [src/lib/sat.ts:11-12](/home/user/astroshopdev/src/lib/sat.ts)
- Secondary progressions (day for a year): `bodyLongitude(k, birthUTC + age days)`. **[run]** Progressed Moon for the Belgrade sample moves from 28.3° Cancer to 12.4° Leo during 2027, so it changes sign.
- Synastry: none. `findAspects()` only pairs within one list, so a cross-chart function is needed.
- Composite chart, astrocartography, Chiron: none. Chiron needs a separate ephemeris and a font glyph. — [src/lib/points.ts:14-16](/home/user/astroshopdev/src/lib/points.ts); CLAUDE.md "Jos nije uradjeno"

### Inferences (effort estimates, all [estimate])
| Technique | Effort | Reuses |
|---|---|---|
| Year transit timeline (all passes and exact dates for a calendar year) | **small** (proven by the scratch script, ~60 lines) | `aktivniTranziti` + `LISTA_ORB` + `dayStatus().exact`, day loop |
| Eclipses (global and local) and their natal house / natal-point hits | **small** | astronomy-engine search + `bodyLongitude` + `houseOf` + `natalTargets` |
| Solar return moment and chart (birthplace or current city from `store/sky-place`) | **small** | bisection on `bodyLongitude('sun')`, `buildNatalChart`, `houseOf` |
| Planetary returns and life cycles (Saturn/Jupiter return, Uranus opposition, Neptune/Pluto square, nodal return) | **small** | same bisection as `sat.ts`/`sky-events.ts`; `trueNodeLongitude` for the nodal return |
| Secondary progressions (progressed Sun/Moon/ASC, sign and house changes) | **small–medium** (progressed ASC/MC needs a convention choice, e.g. solar arc vs Naibod) | `bodyLongitude`, `computeHouses` |
| Synastry aspects and house overlays between two stored charts | **small** (cross version of `findAspects`, natal orbs) | `ASPECTS`, `houseOf`, `useKarta(osobaId)` |
| Composite chart (midpoints, houses from the midpoint MC) | **small–medium** (convention choice) | `norm360`, `computeHouses` math |
| Electional "best days" engine | **medium**: the code is easy (VOC, phases, Mercury retrograde, personal transits); the rules must come from the astrologer | `sat.ts`, `moon.ts`, `aktivniTranziti` |
| Astrocartography lines | **medium–large** (map rendering, a projection per planet line, no map stack in the app) | `rightAscensionMC`, `SiderealTime` |
| Chiron | **large** (separate ephemeris + font, glyph + all 4 wheel renderers) | — |
| Any new computation must also go into the Swift and Kotlin ports only if the widget or watch shows it. Phone-only reports do not need ports (CLAUDE.md rule 27). | — | — |

### Gaps
- I did not benchmark on a phone (Hermes). **[run]** The full script for 3 charts (365 days of transits plus Moon hits, house ingresses, eclipses and progressions) took 12.7 s in Node 22 in this container. A per-user year computation on the phone may take several seconds **[estimate]**, so it could be computed once and cached, or on the server.
- Which progression, solar return location and composite conventions the astrologer uses is not documented anywhere in the repo.

---

## 2. "MOJA 2027" FEASIBILITY: computing all 2027 transits for one chart, and corpus coverage

### Takeaway
A full-year transit list can be computed today with existing functions. The method is to call `aktivniTranziti(chart, day, timeUnknown, LISTA_ORB)` for each of the 365 local days, then merge consecutive active days into passes and collect `exact` days. That gives start, end and every exact date, including the 2–3 passes caused by retrogrades. A typical chart gets about 25–27 slow-planet transits, 31–42 Mars transits, about 150–180 distinct fast transits (Sun, Mercury, Venus) and about 1,070–1,280 exact Moon aspects. Every transit key that occurred in the three samples has both a short and a long text. About 16% of keys target ASC/MC, and their short texts are drafts. What is missing is everything that is not "planet aspect natal point": sky ingress/retrograde texts (60 for 2027, not written yet), eclipses (0 texts), planet in house (0/120), lunation in house (0/24), and any year synthesis or intro text.

### Cited findings
**How to compute (existing pieces)**
- `trajanjeTranzita()` gives only the current pass from a given date, so for a calendar year the day loop is the right tool. — [src/lib/oblasti.ts:153-157](/home/user/astroshopdev/src/lib/oblasti.ts); [src/lib/tvoj-dan.ts:285-296](/home/user/astroshopdev/src/lib/tvoj-dan.ts)
- `dayStatus().exact` marks the day on which the exact aspect falls, which handles multiple exact hits during retrograde loops. — [src/lib/tvoj-dan.ts:113-124](/home/user/astroshopdev/src/lib/tvoj-dan.ts)

**Sample counts for calendar 2027** **[run]**, list orb 3° (sextile 2°), Moon excluded as in the app.

| Sample | Slow Jup–Plu: transits / passes / exact days / with ≥2 exact | Mars | Fast (Sun, Mer, Ven): transits / passes / exact | Total without Moon | Exact Moon aspects to natal targets | Active per day (min / avg / max) |
|---|---|---|---|---|---|---|
| Beograd 15.6.1990 14:30 (ASC Libra 16°, Sun Gemini) | 27 / 33 / 29 / 6 | 42 / 47 / 46 | 180 / 331 / 324 | 249 transits, 411 passes | 1,278 | 7 / 12.8 / 21 |
| Zagreb 3.1.1985 08:00 (ASC Capricorn 17°, Sun Capricorn) | 27 / 35 / 25 / 4 | 41 / 53 / 50 | 180 / 338 / 334 | 248, 426 | 1,277 | 6 / 12.7 / 19 |
| Niš 22.11.1978, time unknown (no ASC/MC; Whole Sign) | 25 / 30 / 26 / 7 | 31 / 39 / 35 | 150 / 276 / 268 | 206, 345 | 1,067 | 4 / 11.1 / 21 |

- Slow transits with at least one exact day inside 2027: 22, 21 and 19. Examples of retrograde multi-pass results **[run]**:
  - Beograd `saturn.square.saturn`: 4.5–9.7 (exact 31.5), 10.9–20.12 (exact 22.10), 27.12–31.12.
  - Beograd `pluto.trine.mercury`: in orb all year, exact 14.2, 8.8 and 23.12.
  - Zagreb `pluto.square.pluto`: all year, exact 2.1.
  - Niš `jupiter.conjunction.moon`: exact 17.1 and 30.6.
- Natal house ingresses of Mars…Pluto in 2027 **[run]**: 11 for each timed sample. Beograd: Jupiter into houses 10, 11 and 12; Saturn into house 7. Zagreb: Uranus into houses 5 and 4 (retrograde); Saturn into house 3. These would need `transit.X.in.house.N` texts, of which 0/120 exist.
- Sky events in 2027 **[run]**:
  - 52 sign ingresses (planets without the Moon).
  - Stations: Mercury R 10.2, D 3.3, R 11.6, D 5.7, R 7.10, D 28.10; Mars R 10.1, D 1.4; Jupiter D 13.4; Saturn R 10.8, D 24.12; Uranus D 8.2, R 15.9; Neptune R 10.7, D 15.12; Pluto R 8.5, D 18.10.
  - `promene-godine.ts` for 1.1–31.12.2027 needs **60** `sky.*` keys (48 `sign`, 12 `retrograde`). 57 of them are already on the list requested on 30.9.2026; only 3 are new (`sky.mars.sign.sagittarius`, `sky.mars.sign.capricorn`, `sky.mercury.retrograde.libra`); union = 63.
- Eclipses within 5° (conjunction/opposition) of a natal point in 2027 **[run]**:
  - Beograd: 1 (lunar 18.7 conjunct natal Saturn, 1.9°).
  - Zagreb: 4.
  - Niš: 2 (solar 2.8 conjunct natal Jupiter, 0.9°; lunar 17.8 opposite natal Moon, 1.0°).
  
  So "personal eclipse hits" are user-dependent; a house placement always exists when the birth time is known.
- Same samples, other techniques **[run]**:
  - Exact aspects of Mars…Pluto to natal true node + mean Lilith in 2027: 13, 11 and 12. No texts exist, and these points are not transit targets (rule 16).

**Corpus coverage for such a report**
- Key universe:
  - 10 transiting bodies × 5 aspects × 12 targets = 600. `izvestaj.py` excludes 3 impossible combinations (Pluto conjunction Pluto, Neptune conjunction Neptune, Pluto opposition Neptune), leaving 597. — [scripts/korpus/parse_docx.py:163-167](/home/user/astroshopdev/scripts/korpus/parse_docx.py); [scripts/korpus/izvestaj.py:33-35](/home/user/astroshopdev/scripts/korpus/izvestaj.py)
  - Imported: short 596, long 595. — [docs/UVOZ-I-NAPOMENE.md:13, 64-65](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md)
  - Missing: short Pluto square ASC; long Pluto square ASC and Pluto trine Pluto. Long Pluto conjunction Neptune and Pluto opposition Pluto contain an astrologer's note instead of a text (old 2025 text kept). — [docs/UVOZ-I-NAPOMENE.md:110-129](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md); [scripts/korpus/parse_docx.py:173-175](/home/user/astroshopdev/scripts/korpus/parse_docx.py)
- In all 3 samples, none of the keys that lack a text occurred **[run]**. 41 of 249 (Beograd) and 40 of 248 (Zagreb) keys target ASC/MC, and their short versions are **drafts summarised from long texts**, awaiting the astrologer (99 of 100 drafts; 160 drafts in total including Moon and Pluto sextile). — [docs/UVOZ-I-NAPOMENE.md:108-117](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md); CLAUDE.md "ETL korpusa"
- Translations: transit, natal and lunar texts are translated and imported in hr, bs and en (`PREVEDEN_KORPUS`); sl and mk fall back to Serbian. — [src/lib/jezik-korpusa.ts:15](/home/user/astroshopdev/src/lib/jezik-korpusa.ts); CLAUDE.md rule 26
- Long texts have sections: essence, spheres, recommendations, effects, challenges, advice, and "more about this transit". — [supabase/transit-texts.sql:18-21](/home/user/astroshopdev/supabase/transit-texts.sql); CLAUDE.md `transit.tsx` description
- Texts the report would need that do not exist:
  - `sky.<planet>.sign|retrograde.<sign>`: 60 for 2027, still pending. — [src/lib/sky-events.ts:16-19](/home/user/astroshopdev/src/lib/sky-events.ts); [docs/ASTRO-LOGIKA.md:233](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
  - Planet in natal house as a transit: 0/120. — [docs/UVOZ-I-NAPOMENE.md:188-189](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md)
  - New/Full Moon in natal house: 0/24, plus 6 phase sentences. — [docs/UVOZ-I-NAPOMENE.md:181-184](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md)
  - Eclipses: 0 (no key scheme exists).
  - Aspects to node and Lilith: 0, and these are not targets.
- Paywall mechanics: long transit texts are returned only when `ima_premium()` is true (subscription OR gift). A one-off "Moja 2027" purchase by a non-subscriber would need a new RLS predicate or a server-side composer. — [supabase/transit-texts.sql:33-39](/home/user/astroshopdev/supabase/transit-texts.sql); [supabase/pokloni.sql:48](/home/user/astroshopdev/supabase/pokloni.sql)
- Rule 7 says the composer should eventually run on the server, and rule 8 says the API must never send the full text to a user without access. — CLAUDE.md rules 7, 8

### Inferences
- [estimate] A sensible "Moja 2027" uses about 25–27 slow transits (long texts), about 30–40 Mars transits (short texts or one line each), month-level fast-planet highlights, 60 sky events, 5 eclipses and 24–26 lunations. Fast-planet transits (about 280–340 passes per year) and Moon hits (about 1,100–1,300) are too many for a narrative report. They fit a calendar view or are better left out.
- [estimate] Texts the astrologer would need specifically for "Moja 2027":
  - Year-specific: 3 extra sky keys (60 overall, already requested); 5 generic eclipse texts for 2027, or 24 reusable texts by sign axis.
  - Reusable personal: eclipse in natal house (2 types × 12 = 24); lunation in house (24, already requested); Jupiter and Saturn through natal houses (24; all planets = 120, already requested).
  - Report framing: an intro and closing per year theme and per quarter or month (about 10–20 templates).
  - Total new beyond what is already requested: about 30–60; including the pending ones, about 140–230.
- Exact dates are computed at local midnight resolution (day level). That is enough for a report, but times of exact hits would need bisection (easy, as in `sat.ts`).
- With an unknown birth time, about 17% fewer transits (no ASC/MC) and no houses. The report must say so (rules 4/5).

### Gaps
- Word counts of the long transit texts are unknown: the corpus CSV is on Ivan's Desktop, not in the repo (`~/Desktop/Astroshop App/Tranziti AstroShop/transit-texts.csv`, 2.4 MB for 1,191 rows). — [docs/UVOZ-I-NAPOMENE.md:13, 55](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md). Length of a "Moja 2027" PDF can only be estimated.
- [docs/ASTRO-LOGIKA.md:354-366](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md) still shows old corpus numbers (433/600, 443/600); CLAUDE.md and UVOZ say 596/595. The UVOZ numbers are newer.

---

## 3. CONTENT ASSETS: every corpus, with counts, coverage and languages

### Takeaway
There are five server-side astrologer corpora and several smaller client-side text sets:

| Corpus | Size | Languages |
|---|---|---|
| Transits | 596 short + 595 long | sr + hr/bs/en |
| Natal | 508: 116 planet-in-sign, 12 ASC-in-sign, 120 planet-in-house, 260 aspects | sr + hr/bs/en |
| Lunar calendar | 420 = 7 phases × 12 signs × 5 areas | sr + hr/bs/en |
| Comparison horoscope | 430 of 432 = 144 directed Sun-sign pairs × love/friendship/work | sr only |
| Website sign descriptions | 12 signs | sr only |

Smaller sets: astrologer subtitles (36 phrases, sr/hr/bs/en), symbolism keywords (35 entries, sr), life-wheel sentences (144 + 8, sr, proposal pending), Ask-topic templates (sr). Pending: sky ingress/retrograde (60), planet in house as a transit (120), lunations in house (24), Moon phase sentences (6), MC-in-sign natal (none planned).

### Cited findings
| Asset | Where | Count / coverage | Languages | Access |
|---|---|---|---|---|
| Transit texts, short and long; key `transit.<p>.<asp>.natal.<target>` | table `transit_texts` (key, version, jezik) — [supabase/transit-texts.sql:10-23](/home/user/astroshopdev/supabase/transit-texts.sql) | short 596, long 595 of 597 possible; 160 short are drafts summarised from long (Moon 50, ASC/MC 99, Pluto sextile 10, Mercury conjunction Pluto 1); lektura 775 fixes — [docs/UVOZ-I-NAPOMENE.md:13, 108-131](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md) | sr original; hr, bs, en imported 6–7.10.2026 — [src/lib/jezik-korpusa.ts:15](/home/user/astroshopdev/src/lib/jezik-korpusa.ts) | short for any logged-in user; long only `ima_premium()` |
| Transit tone (povoljno / izazovno / mešovito) | column `tone` — [supabase/transit-tone.sql:12](/home/user/astroshopdev/supabase/transit-tone.sql) | rule-computed; manual override optional | sr row only | — |
| Natal texts; keys `natal.<p>.sign.<s>`, `natal.<p>.house.N`, `natal.<a>.<asp>.<b>` | table `natal_texts` (kind sign/house/aspect, title, subtitle, body, free) — [supabase/natal-texts.sql:12-21](/home/user/astroshopdev/supabase/natal-texts.sql) | 508: planets in signs 116/116, ASC 12/12, houses 120/120, aspects 260/260 (planets + ASC; **no MC aspects, MC has no text**); 36 free (Sun, Moon, ASC in sign); single blocks up to 534 words, split into 1,442 paragraphs (longest 108 words); lektura 896 fixes — [docs/UVOZ-I-NAPOMENE.md:137-139](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md); [docs/ASTRO-LOGIKA.md:305-310](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md); CLAUDE.md "Natalna tumacenja" | sr + hr/bs/en | free 36; rest `ima_premium()`; `natal_naslovi` / `natal_kartice` return titles + first sentence only — [supabase/natal-kartice.sql:17-36](/home/user/astroshopdev/supabase/natal-kartice.sql) |
| Lunar calendar, key `lunar.<phase>.<sign>.<area>`; areas ljubav, zdravlje (and beauty), karijera (and finance), kuća, bašta | table `lunar_texts` — [supabase/lunar-texts.sql:10-18](/home/user/astroshopdev/supabase/lunar-texts.sql) | 420/420; 129 lists have only 1–2 items; 53 of 84 garden texts have no "avoid" items; lektura 899 — [docs/UVOZ-I-NAPOMENE.md:149-176](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md). **[run]** 78 of the 84 phase×sign combinations occur in 2027 (all covered) | sr + hr/bs/en | free for logged-in users |
| Comparison horoscope (Sun sign → Sun sign), key `uporedni.<a>.<b>.<area>` | table `uporedni_texts` — [supabase/uporedni-texts.sql:13-23](/home/user/astroshopdev/supabase/uporedni-texts.sql); [src/lib/uporedni.ts:50-52](/home/user/astroshopdev/src/lib/uporedni.ts) | 430 of 432, about 67,900 words; missing Leo→Virgo love (truncated on the site) and Sagittarius→Cancer work; 496 typo fixes; 9 wording issues for the astrologer — [docs/ASTRO-LOGIKA.md:551-558](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md) | **sr only** (column `jezik` exists) | free for logged-in users |
| Website sign descriptions (`ZNAK_OPIS`: summary, love, work, "how to win", values, gender, look, body part, animal, stone, colour, plant, food) | [src/lib/znak-opis-podaci.ts:11-30](/home/user/astroshopdev/src/lib/znak-opis-podaci.ts) (generated from astroshop.rs, public) | 12 signs; first sentences only (≤34 words) | sr only | on client (public website text) |
| Astrologer subtitles ("Kralj Zodijaka") for Sun / Moon / ASC in sign | [src/lib/natal-podnaslovi-podaci.ts:7-20](/home/user/astroshopdev/src/lib/natal-podnaslovi-podaci.ts) | 36 phrases | sr, hr, bs, en | on client (phrases only) |
| Symbolism keywords (planets, signs, houses, aspects) | [src/lib/simbolika.ts:18-64](/home/user/astroshopdev/src/lib/simbolika.ts) | 35 entries (planets, signs, houses, aspect theme + sentence) | sr only | on client |
| Life-wheel sentences (area × transiting planet × tone + neutral) | [src/i18n/sr/krug-recenice.ts:1-7](/home/user/astroshopdev/src/i18n/sr/krug-recenice.ts) | 152 lines = 144 + 8 neutral; a **proposal waiting for the astrologer**, temporarily on the client | sr only | client (marked temporary) |
| Ask-astrologer topics and template questions | `src/i18n/sr/pitaj-teme.ts` (CLAUDE.md rule 21) | 7 topics + 3 questions each (proposal) | sr only | client |
| Sign traits | [src/lib/traits.ts](/home/user/astroshopdev/src/lib/traits.ts) | 12 × 3, no longer displayed | sr | client |
| Pending / not written | — | `sky.*` ingress/retrograde: 60 for the year from 30.9.2026 and 60 for calendar 2027 (union 63) **[run]**; planet in house as transit 0/120; lunation in house 0/24; Moon phase sentences 0/6 — [docs/UVOZ-I-NAPOMENE.md:181-189](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md); [docs/ASTRO-LOGIKA.md:233](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md) | — | — |
| Voice | — | the corpus is written in the formal "Vi" (506 of 508 natal; comparison texts also "Vi"); the UI uses informal "ti"; no decision yet — CLAUDE.md rule 26; [docs/ASTRO-LOGIKA.md:557](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md) | — | — |

### Inferences
- The biggest reusable assets for paid reports are the 595 long transit texts (a year report, life cycles, monthly forecasts) and the 508 natal texts (love, career and child reports, by selection). Both are already translated into hr, bs and en. Anything new written only in Serbian would break the 4-language parity that exists for the transit, natal and lunar corpora.
- Natal texts are one block per placement, split into paragraphs by topic, but paragraphs are **not tagged by life area**. A love or career report would therefore need either new focused texts or a tagging pass over the 1,442 paragraphs **[estimate]**.

### Gaps
- No corpus text bodies are in the repo (rule 7; `files/` does not exist in this checkout), so I could not measure lengths or tone per text, or check how "daily" the short texts sound for a year-report context.

---

## 4. Per-product readiness: what is ready, what must be computed, what texts are missing

### Takeaway
Life cycles, the personal lunar/garden calendar and the natal poster are almost entirely covered by existing computation and texts; "Moja 2027" and the eclipse report are close. Synastry, child, love/career and solar-return reports need substantial new writing. Gift versions are technically easy (other people's charts are already stored), but delivery runs into the repo's rule that user-typed codes are not allowed.

### Cited findings (facts the table relies on)
- Other people's charts:
  - Stored in table `osobe`: same fields as the profile; relation one of partner, dete (child), roditelj (parent), brat/sestra (sibling), prijatelj (friend), drugo (other). Limit 1 free / 10 Premium, enforced by a database trigger. — [supabase/osobe.sql:22-42, 79](/home/user/astroshopdev/supabase/osobe.sql); [src/lib/osobe.ts:16-19](/home/user/astroshopdev/src/lib/osobe.ts); [src/lib/pristup.ts:36-43](/home/user/astroshopdev/src/lib/pristup.ts)
  - Interpretation sheets accept `?osoba=`, and `useKarta(osobaId)` builds the chart. — CLAUDE.md rule 22
- The one-time natal purchase is a stub: `kupiNatalnuKartu()` returns `'nedostupno'`, test price 24.99 €. A separate permanent-purchase table plus an `ima_premium() OR purchased` policy is planned but does not exist. — [src/lib/kupovina.ts:92-112](/home/user/astroshopdev/src/lib/kupovina.ts)
- The product catalogue separates in-app items (widget, premium, natalna, sat, pitanje) from website items (bracelet, consultations). Website PDF products are deliberately not listed (Apple 3.1.1). — [src/lib/proizvodi.ts:1-54](/home/user/astroshopdev/src/lib/proizvodi.ts)
- Natal MC has no interpretation and MC aspects are not used. — [docs/ASTRO-LOGIKA.md:310](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md); [supabase/natal-texts.sql:15](/home/user/astroshopdev/supabase/natal-texts.sql)
- Life-cycle transits are ordinary keys in the existing corpus: `saturn.conjunction.natal.saturn`, `jupiter.conjunction.natal.jupiter`, `uranus.opposition.natal.uranus`, `neptune.square.natal.neptune`, `pluto.square.natal.pluto`, `saturn.opposition.natal.saturn`. Only Pluto trine Pluto (long) and Pluto opposition Pluto (long, placeholder) are problematic. — [docs/UVOZ-I-NAPOMENE.md:119-129](/home/user/astroshopdev/docs/UVOZ-I-NAPOMENE.md). **[run]** Zagreb 1985 has `pluto.square.pluto` exact on 2.1.2027.
- Lunar texts cover phase × sign × 5 areas, including garden. VOC and planetary-hour definitions are still waiting for the astrologer. — [docs/ASTRO-LOGIKA.md:340-349](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
- The astrologer was asked whether some texts should not be shown as a reading of someone else's chart, given they are written in "Vi" (question 15). — [docs/ASTRO-LOGIKA.md:386](/home/user/astroshopdev/docs/ASTRO-LOGIKA.md)
- The repo rule says a code typed in the app is not allowed for unlocking; campaigns use Apple Offer Codes. — CLAUDE.md rule 8

| # | Product | READY | MUST BE COMPUTED | TEXTS MISSING [estimate of new texts] |
|---|---|---|---|---|
| 1 | Moja 2027 | the whole transit engine (passes, exact days); 595 long + 596 short transit texts in 4 languages; 60 sky-event keys identified; lunar 420 | year loop (small); eclipse search (small); house ingresses (small); report assembly and PDF (see §5) | 60 sky (pending), 24 lunation in house (pending), up to 120 planet in house (pending; 24 for Jupiter and Saturn alone), eclipses 5–24 generic + 24 house, intro and month frames ~10–20. **≈30–60 truly new + 100–170 already requested** |
| 2 | Solar return 2027–28 | `buildNatalChart`, `houseOf`, `findAspects`; transit texts usable for SR-to-natal contacts only loosely | SR moment (bisection, small); SR chart at birthplace or current city (`store/sky-place`) | no SR texts: SR ASC sign 12, SR Sun house 12, SR Moon sign 12 + house 12, SR planets in SR houses up to 120. **≈48–170** |
| 3 | Monthly forecast | per-day transits, lunar calendar, sky events, life-wheel ratings per day (`krug.ts`) | month aggregation (small) | month intro and synthesis templates (~12–24), plus the same pending 60 sky / 24 lunation texts. **≈12–30 new** |
| 4 | Full synastry (two stored charts) | both charts (`osobe`, `useKarta`); `ASPECTS`; comparison Sun-sign texts 430 (sr); natal texts are about ONE person | cross-aspects + house overlays (small); composite optional (small–medium) | synastry aspect texts: 55 unordered planet pairs (incl. same planet) + 11 ASC pairs = 66 pairs × 5 aspects ≈ **330** (up to ~600 if directional); house overlays 10 × 12 = **120**. **≈330–700** |
| 5 | Child's chart for parents | `osobe.odnos = 'dete'`; full natal computation; natal texts exist but are adult-voiced "Vi" | nothing new | child-specific texts: Sun, Moon, ASC in sign 36; Mercury sign (learning) 12; Venus and Mars sign 24; Moon house 12; Saturn 12. **≈60–120**, plus an astrologer answer to question 15 |
| 6 | Love/relationship natal report | Venus/Mars/Moon sign and house texts (paid natal), aspects involving them (a subset of the 260), comparison love texts by Sun sign (144, sr) | 5th/7th house cusp signs and rulers (small; `signRulers`, `houseOf`) | 7th and 5th cusp in sign 24, ruler of the 7th in house 12, love-focused Venus/Mars 24–48 (or tagging existing paragraphs). **≈50–150** |
| 7 | Career/vocation report | Sun, Saturn, Jupiter sign and house texts; life-wheel career mapping (house 10/6, Saturn, Jupiter, MC) — [src/lib/krug-config.ts:27](/home/user/astroshopdev/src/lib/krug-config.ts) | MC sign, 10th/6th/2nd cusps, ruler of the MC (small) | **MC in sign 12 (none exist)**, 10th/6th/2nd cusp sign 36, ruler of the 10th in house 12, career-focused framing ~10. **≈30–80** |
| 8 | Life cycles (Saturn return, Jupiter returns, nodal return, midlife) | all key transit texts already in the long corpus (see above); `trueNodeLongitude` | exact return dates over a lifetime (small; bisection like `sat.ts`), nodal return (small) | nodal return / reverse nodal return 2–4, life-stage intros ~6–10, Pluto trine Pluto long 1, Pluto opposition Pluto long 1 (astrologer note). **≈10–15** |
| 9 | Personal eclipse report | astronomy-engine eclipse search works (2027: 2 solar, 3 lunar); `houseOf`, `natalTargets`; local visibility (`SearchLocalSolarEclipse`) | eclipse to natal house and points (small) | none exist: eclipse in house 2 × 12 = 24; eclipse on natal point 2 types × 2 (conjunction/opposition) × 12 = 48; per-eclipse or sign-axis generic 5–24. **≈30–100** |
| 10 | "Best days" electional calendar | VOC, phases, lunar day, planetary hours, stations, Mercury retrograde, personal transits; lunar texts with 5 areas (incl. "Zdravlje i lepota", "Bašta") | rule engine per activity (medium); VOC/hours definitions must be confirmed by the astrologer (§7) | activity rules + short explanations: ~8–12 activities × 1–3 texts. **≈20–50**; haircut is not an explicit area (closest is "Zdravlje i lepota") |
| 11 | Personal lunar/garden calendar for the year | 420 lunar texts (4 languages) covering all 78 combinations that occur in 2027 **[run]**; calendar grid; plant part computed; 25 New/Full Moon days in 2027 **[run]** | yearly calendar assembly (small); personal house of each lunation (exists: `lunationHouse`) | 24 lunation-in-house (pending); optional garden "do / avoid" restructuring (53/84 lack "avoid"). **≈0–24 new** |
| 12 | Printable PDF / poster of the natal chart | the wheel exists in 3 renderers (RN `natal-wheel.tsx`, browser SVG `panel/src/tocak.tsx`, Swift `SkyRender` PNG); symbolism keywords | high-resolution export (medium; see §5) | none required (optional symbolism legend: 35 entries exist, sr) |
| 13 | Gift version (any of the above for someone else) | other people's charts stored and rendered with the same components; share sheet; image and video export | buyer → recipient delivery (no mechanism) | depends on the base product; the voice issue (question 15) applies |

### Inferences
- Cheapest to launch, judged by new texts **[estimate]**: (8) life cycles ≈10–15, (11) lunar/garden year ≈0–24, (12) poster 0, (1) "Moja 2027" ≈30–60 new (the rest is already requested for the app itself), (9) eclipses ≈30–100. Most expensive: (4) synastry ≈330–700 and (2) solar return ≈48–170.
- The pending texts (60 sky, 24 lunations, 120 planet in house) serve the app's free screens and paid reports at the same time, so commissioning them has double value.
- An eclipse report on its own is thin for some users (sample: 1–4 close natal hits in 2027). A house-based reading gives every user with a known birth time 5 placements **[run]**. It may work better as a chapter of "Moja 2027" than as a standalone product **[inference]**.

### Gaps
- No pricing data or sales history in the repo; prices in the code are test placeholders (19.99 €, 24.99 €, 49.99 €, 5.99 €, 4.99 €) and explicitly "not a decision". — [src/lib/kupovina.ts:44, 78-80, 103, 118](/home/user/astroshopdev/src/lib/kupovina.ts)
- Whether the astrologer accepts reuse of daily-style transit texts in a yearly narrative is not discussed anywhere in the repo.

---

## 5. Existing infrastructure reusable for paid reports (PDF, images, video, push, one-time entitlements)

### Takeaway
Reusable today: shareable 1080×1920 PNG cards, a native video exporter (iOS and Android), local notifications, server-side RLS paywall functions and Supabase Edge Functions. Missing: any PDF generation, a server push pipeline, RevenueCat, and an entitlement model that can hold more than one non-subscription purchase per user.

### Cited findings
- Image cards: a 360×640 card is captured with `react-native-view-shot`, scaled to 1080×1920 PNG with `expo-image-manipulator`, and shared with `expo-sharing` (file "Astro Shop <day>.png"). Used in `src/components/prica/plejer.tsx:263-264` and `src/app/prica.tsx:298`. — CLAUDE.md rule 23; [package.json](/home/user/astroshopdev/package.json) dependencies `react-native-view-shot@5.1.0`, `expo-image-manipulator`, `expo-sharing`
- Video: local native module `modules/video-price`: H.264 1080×1920, 30 fps, iOS AVAssetWriter / Android MediaCodec. It renders cards frame by frame off-screen and saves to Photos or Gallery. Generic "job" API (`PosaoVidea`, `components/prica/poslovi-videa.tsx`), so a new story with export means one new function. — CLAUDE.md rule 23; [modules/](/home/user/astroshopdev/modules)
- Notifications: `expo-notifications` is installed. It is used for a local "video ready" notification (`src/components/prica/video-radionica.tsx:5, 253`) and for the permission step in onboarding (`src/app/(onboarding)/push.tsx:4`). Server push does not exist yet. — CLAUDE.md "Push notifikacije" / rule 21
- PDF: **no PDF library** (no `expo-print`, `react-native-pdf`, `pdf-lib`, `jspdf`) in `package.json`; grep finds none in `src`. — [package.json](/home/user/astroshopdev/package.json)
- Wheel renderers usable for a poster:
  - RN SVG `natal-wheel.tsx`
  - browser SVG `panel/src/tocak.tsx`, which shares geometry with the app via `wheel.ts`, `tocak-stil.ts`, `znak-oblici.ts`
  - Swift `swift run SkyRender <folder>`, a PNG of the wheel
  
  Source: CLAUDE.md rules 21, 27; [panel/src/tocak.tsx](/home/user/astroshopdev/panel/src/tocak.tsx)
- Server:
  - Supabase Edge Functions exist only for `delete-account` and `obavesti-astrologa`; there is no report or composer function. — [supabase/functions/](/home/user/astroshopdev/supabase/functions)
  - Shared SendGrid mail helper `_shared/obavestenje.ts`. — CLAUDE.md rule 21
- Entitlements:
  - Table `entitlements` is `user_id` primary key with a single `product_id` and `expires_at` (NULL = one-time). That is one row per user, so it cannot represent several one-time reports. — [supabase/schema.sql:59-73](/home/user/astroshopdev/supabase/schema.sql)
  - `pokloni` (admin-granted Premium) and `ima_premium()` = purchase OR gift. — [supabase/pokloni.sql:26-48, 78](/home/user/astroshopdev/supabase/pokloni.sql)
  - Consumable-credit pattern: `pitanja_krediti` (reasons: `kupovina_bez_nacrta`, `poklon`), redeemed by the security-definer function `posalji_kreditom`. — [supabase/pitanja.sql:154-157, 217](/home/user/astroshopdev/supabase/pitanja.sql)
- RevenueCat is not integrated: `kupiPitanje`, `kupiPremium`, `kupiNatalnuKartu` all return `'nedostupno'`; Offerings ids planned `question` / `question_member`. — [src/lib/kupovina.ts:29, 89, 110](/home/user/astroshopdev/src/lib/kupovina.ts); CLAUDE.md rule 21
- Offline cache of server texts (300 items, 14 days, key includes account, access right and language) could hold a purchased report for offline reading. — CLAUDE.md rule 19 (`lib/kes-na-disku.ts`)

### Inferences
- [inference] A paid report should follow the existing pattern: purchase (RevenueCat consumable or non-consumable), then webhook writes a row to a new `kupovine`-style table (user_id, product_id, chart/osoba id, year). RLS or an Edge Function checks it and returns the texts. This keeps rules 7 and 8, and it is the same "separate table" decision already planned for the one-time natal purchase. — [src/lib/kupovina.ts:96-100](/home/user/astroshopdev/src/lib/kupovina.ts)
- [inference] A PDF built on the device would put full corpus texts into a shareable file that leaves the app. It is the purchased product, but it conflicts with the spirit of rule 7. Server-side generation (an Edge Function plus the panel's SVG wheel) or an in-app reader with only image/video sharing fits the repo's rules better.
- [inference] The 1080×1920 card and video pipeline can carry a "Moja 2027" teaser or a year video (top 5 transits, eclipses) for Instagram, as the daily story does.

### Gaps
- Gifting: the repo forbids user-entered unlock codes (rule 8) and has no buyer-to-recipient delivery. I recall that Apple's App Review Guideline 3.1.1 allows gifting of IAP-eligible items, but I did not verify that in this session. Check https://developer.apple.com/app-store/review/guidelines/#in-app-purchase before relying on it.
- Physical poster: the product list already routes physical goods to astroshop.rs (`vrsta: 'sajt'`), but no print fulfilment exists in the repo.
