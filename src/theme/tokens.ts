/**
 * Dizajn tokeni — IZMERENI, ne pretpostavljeni.
 *
 * Sve vrednosti su ocitane iz snimaka ekrana referentne aplikacije (Luma, iOS,
 * iPhone 15/16 Pro, 1179x2556 px = 393x852 pt, @3x). Boje su modalna vrednost
 * unutar povrsine elementa (ne prosek — prosek povuce antialiasing ivica), a
 * mere su bounding box u pikselima podeljen sa 3.
 *
 * Ovaj fajl je JEDINI izvor istine. `global.css` ispisuje iste boje kao HSL
 * varijable za NativeWind, `tailwind.config.js` iste mere kao klase. Ako se
 * nesto menja — menja se OVDE pa se prepise na druga dva mesta.
 *
 * Zasto i TS konstante kad postoje Tailwind klase: nativne komponente
 * (`GlassView`, `Animated.View`, `Stack.screenOptions`, `placeholderTextColor`)
 * ne primaju className — NativeWind ih tiho preskoci. Za njih treba broj.
 */

/* ------------------------------------------------------------------ */
/* BOJE                                                                */
/* ------------------------------------------------------------------ */

/**
 * Neutralna skala. Referentna aplikacija ima SAMO svetlu temu i drzi se
 * crno-bele osnove — boja se pojavljuje iskljucivo u ikonama i ilustracijama.
 */
export const neutral = {
  /** Pozadina ekrana. */
  white: '#FFFFFF',
  /** Pozadina ekrana sa grupisanim karticama (Podesavanja). Kartice su bele NA ovome. */
  grouped: '#F6F7F8',
  /** Ispuna polja za unos, kruzne ikone, neaktivne povrsine. */
  fill: '#F5F5F5',
  /** Jaca ispuna — aktivna kapsula u traci, sekundarno dugme. */
  fillStrong: '#EBEBEB',
  /** Linija razdvajanja i ivica kapsula. Uvek 1pt. */
  separator: '#F0F0F0',
  /** Glavni tekst i primarno dugme. NIJE cisto crno — #000 na belom "zvoni". */
  ink: '#151515',
  /**
   * Ivica crnog dugmeta — jedan PIKSEL, korak tamnija od ispune.
   * Zapisana jer je izmerena; ne crta se (tri nivoa od 255 se ne vide).
   * Presek kroz dugme: belo -> antialiasing -> #121212 -> svetli sjaj -> #151515.
   */
  inkEdge: '#121212',
  /** Sekundarni tekst: opisi, meta podaci. */
  inkMuted: '#727273',
  /** Tercijarni tekst: placeholder, naslov sekcije, neaktivan tab. */
  inkSubtle: '#9C9C9D',
} as const;

/**
 * Akcenti. Koriste se ISKLJUCIVO na ikonama (kvadratic 28pt u redovima
 * podesavanja) i na mehuricu poruke — nikad kao pozadina ekrana ili dugmeta.
 * Tako ekran ostaje miran, a boja nosi znacenje.
 */
export const accent = {
  blue: '#427CF6',
  /** Sistemski plavi ton na ikonama — za nijansu hladniji od mehurica. */
  blueIcon: '#3773F6',
  purple: '#6F3CF6',
  red: '#EB4743',
  green: '#6ECF6F',
  pink: '#EB3C86',
  yellow: '#F4C844',
  gray: '#9A9C9D',
  black: '#14171B',
} as const;

/* ------------------------------------------------------------------ */
/* TIPOGRAFIJA                                                         */
/* ------------------------------------------------------------------ */

/**
 * PISMO JE OD 28.9.2026 SATOSHI (`theme/font.ts`). Ispod je istorija merenja
 * iz vremena sistemskog pisma — velicine su iz nje i ostaju.
 *
 * KOJE JE PISMO NA SNIMCIMA — sta se zna, a sta ne:
 *
 *   Poredjenje oblika slovo po slovu (IoU preko 46 slova iz tri reci):
 *     Inter 0,863 | Helvetica Neue 0,852 | SF Pro 0,832
 *   Odnos x-visine prema verzalu, koji ne zavisi od rendovanja:
 *     snimak 0,7348 | SF Pro 0,7431 | Inter 0,7500 | Helvetica Neue 0,7200
 *
 *   Oblici vuku ka Inter-u za dlaku, proporcije ka SF Pro-u za dlaku. Na
 *   verzalu od 44 px sa greskom merenja od +-1 px obe razlike su UNUTAR SUMA
 *   — Inter i SF Pro se sa ovih snimaka ne mogu razlikovati. Jedino sto se
 *   pouzdano iskljucuje je Helvetica Neue: noga slova "R" daje 0,63 prema
 *   0,86 kod ostala dva.
 *
 *   Presudila je druga vrsta dokaza: referentna aplikacija je nativna iOS
 *   aplikacija, a izvedene velicine padaju tacno na iOS-ovu lestvicu
 *   (17 body, 15 subheadline, 13 footnote, 11 caption2). To je sistemsko
 *   pismo, ne uvezeno.
 *
 * Debljina se bira Tailwind klasama za TEZINU (`font-semibold`), sto sa
 * sistemskim pismom radi kako treba. Tako je i jednostavnije nego kad se
 * ucitava spoljno pismo: tamo je svaki rez zasebna familija pa `fontWeight`
 * ne radi.
 */
/**
 * Brend boja iz loga — indigo kruga (`logo-krug.json`). Nije izmerena sa
 * referentne aplikacije nego uzeta iz brend fajla, pa nema CSS varijablu i ne
 * ide kroz `check:tokens`. Koristi se za krug loga i izabrani tab (Ivan, 27.9.2026).
 */
export const brand = {
  indigo: '#403F98',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Tipografska skala.
 *
 * Velicine su izvedene iz visine verzala izmerene na snimku: za svaki stil je
 * potrazena velicina SF Pro-a (sa optickom velicinom = toj velicini) ciji je
 * verzal tacno toliko visok. `line` je visina reda — 15/20 je izmereno
 * direktno (dva puta, 60 px vrh-do-vrha), ostalo prati iOS-ovu lestvicu, na
 * koju izvedene velicine i inace padaju.
 */
export const type = {
  /** Naslov ekrana u praznom stanju: "Get Started", "Chat on Luma". */
  title: { size: 21, line: 26, weight: fontWeight.bold, color: neutral.ink },
  /** Naslov sekcije u listi: "Browse by Category", "Picked for You". */
  section: { size: 20, line: 25, weight: fontWeight.bold, color: neutral.ink },
  /** Naslov u navigacionoj traci: "Settings". Veci je od iOS podrazumevanih 17. */
  navTitle: { size: 18, line: 23, weight: fontWeight.semibold, color: neutral.ink },
  /** Naslov reda/kartice: "Account Settings", ime dogadjaja. */
  rowTitle: { size: 17, line: 22, weight: fontWeight.medium, color: neutral.ink },
  /** Natpis na dugmetu. */
  button: { size: 17, line: 22, weight: fontWeight.semibold, color: neutral.white },
  /** Naslov grupe iznad kartica: "Preferences", "Resources". Siv, ne verzal. */
  group: { size: 17, line: 22, weight: fontWeight.medium, color: neutral.inkSubtle },
  /** Tekuci tekst i opisi. */
  body: { size: 15, line: 20, weight: fontWeight.regular, color: neutral.inkMuted },
  /** Natpis u kapsuli kategorije. */
  chip: { size: 15, line: 20, weight: fontWeight.medium, color: neutral.ink },
  /** Meta podatak uz stavku: vreme, mesto. */
  meta: { size: 15, line: 20, weight: fontWeight.regular, color: neutral.inkMuted },
  /** Sitan podnaslov: "View Profile". */
  caption: { size: 13, line: 18, weight: fontWeight.regular, color: neutral.inkMuted },
  /** Natpis ispod ikone u traci. */
  tab: { size: 11, line: 13, weight: fontWeight.medium, color: neutral.inkSubtle },
} as const;

/* ------------------------------------------------------------------ */
/* MERE                                                                */
/* ------------------------------------------------------------------ */

/**
 * Poluprecnici.
 *
 * Referentna aplikacija ima samo DVE vrednosti koje se ponavljaju: 24 za sve
 * pravougaone povrsine (kartica, polje za unos, dugme) i puna kapsula za sve
 * sto je nisko i siroko. Posto su dugme (50pt) i polje (48pt) niski, 24 na
 * njima IZGLEDA kao kapsula — zato se u kodu i pisu kao kapsula.
 */
export const radius = {
  /** Kvadratic ikone u redu podesavanja (28pt). */
  tile: 8,
  /** Mehuric poruke. */
  bubble: 16,
  /** Kartica, grupa redova, veliki panel. 12 = pola reference (Ivan, 28.9.2026; bilo 24). */
  card: 12,
  /** Dugme, polje, kapsula kategorije, traka. */
  pill: 999,
} as const;

/** Razmaci. Osnovna jedinica je 4; ekran ima 20pt margine sa obe strane. */
export const space = {
  /** Leva i desna margina ekrana. Izmereno: kartica pocinje na 20pt. */
  screen: 20,
  /** Unutrasnji vodoravni razmak u kartici i redu. */
  gutter: 16,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 32,
} as const;

/** Visine elemenata — sve izmereno, ne zaokruzeno "na oko". */
export const size = {
  /** Primarno dugme preko cele sirine. */
  button: 50,
  /** Nize dugme u modalnom listu. */
  buttonCompact: 46,
  /** Polje za unos. */
  field: 48,
  /** Red u grupi podesavanja. */
  row: 57,
  /** Kvadratic ikone u redu. */
  tile: 28,
  /** Kruzno dugme u zaglavlju ekrana. */
  headerButton: 40,
  /** Kapsula kategorije. */
  chip: 40,
  /** Lebdeca traka na dnu — izmerena u referenci; od 26.9.2026. traka je NATIVE (`NativeTabs`), broj ostaje kao trag. */
  tabBar: 65,
  /** Debljina svake linije razdvajanja. */
  hairline: 1,
} as const;

/**
 * Senke. Referentna aplikacija ih koristi STEDLJIVO — samo lebdeca traka i
 * modalni list imaju senku. Kartice na sivoj pozadini nemaju nijednu; razdvaja
 * ih razlika u boji, ne senka.
 */
export const shadow = {
  /**
   * Belo dugme na beloj pozadini (zaglavlje, "Skip", neaktivno dugme).
   *
   * Referentna aplikacija ih NE ocrtava ivicom — provereno skeniranjem piksela
   * poprecno kroz dugme: nema skoka u boji, nego mek prelaz sa #FFFFFF na
   * #F9F8F9 ka sredini. To je senka, ne linija. Ivica bi na ovako niskom
   * kontrastu izgledala nacrtano; senka izgleda podignuto.
   */
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  floating: {
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -4 },
    elevation: 16,
  },
} as const;

/* ------------------------------------------------------------------ */
/* VRH EKRANA                                                          */
/* ------------------------------------------------------------------ */

/**
 * Preliv na vrhu ekrana.
 *
 * Za razliku od ostalih tokena ovi nisu ocitani sa snimaka nego PROCITANI iz
 * `getComputedStyle` na luma.com — referenca tamo postoji i kao veb aplikacija,
 * pa se vrednost ne mora vaditi iz piksela. Element je `.background` u zaglavlju.
 *
 * Tri stvari koje se lako promase:
 *
 * 1. Preliv stoji IZNAD sadrzaja, ne ispod njega. Sve tri boje su providne
 *    (0,2 -> 0,1 -> 0), pa kartice prolaze ispod njega i primaju nijansu.
 *    Da je pozadina, kartice bi ostale bele i efekta ne bi bilo — to je cela
 *    tajna izgleda i jedina stvar koju ne smes da "pojednostavis".
 *
 * 2. Ne sme da hvata dodir. Bez `pointerEvents="none"` preliv pokrije gornjih
 *    230pt liste i tamo nista ne moze da se pritisne.
 *
 * 3. Visina se meri od SAMOG vrha ekrana, ispod statusne trake. Na vebu
 *    statusne trake nema pa je tamo 230px od vrha prozora; ovde je 230pt od
 *    vrha uredjaja, sto na telefonu sa zarezom znaci da preliv zavrsi oko 70pt
 *    ispod trake — isti odnos kao u referenci.
 */
export const backdrop = {
  /**
   * Visina preliva, od vrha ekrana. Referenca je 180; spusteno za 50 da preliv
   * sezne dublje i jace se vidi (Ivan, 27.9.2026).
   */
  height: 230,
  /**
   * Tri boje iz reference, ali JACE: vrh 0,40, sredina 0,17 (Ivan, 28.9.2026: uz zivi
   * preliv "previse je jako"; bilo 0,50 / 0,21, a pre toga 0,40 / 0,21).
   *
   * Referenca ima 0,2 / 0,1 / 0. Toliko se na vebu, preko sirokog prozora,
   * lepo vidi — na telefonu je preslabo i preliv izgleda kao prljav ekran, ne
   * kao boja. Nijansa je ista, samo jaca; ovo je jedino mesto gde namerno
   * odstupamo od izmerene vrednosti.
   *
   * Ako treba jace ili slabije, menja se SAMO alfa ovde — nigde drugde nije
   * prepisana.
   */
  colors: ['rgba(125, 83, 230, 0.40)', 'rgba(57, 91, 242, 0.17)', 'rgba(95, 121, 198, 0)'],
  /** Polozaji zaustavljanja: vrh, sredina, dno. */
  locations: [0, 0.5, 1],
  /**
   * Nijanse preliva po ekranu (Ivan, 26.9.2026): `purple` je izmerena referentna
   * (isto sto i `colors`), ostale su NASE, izvedene iz akcenata sa istim
   * providnostima 0,40 / 0,17 / 0 da se ponasaju isto nad karticama.
   * Ekran bira nijansu kroz `<Screen tint="blue">`; pri promeni ekrana preliv
   * se pretapa iz prethodne nijanse u svoju (`ScreenBackdrop`).
   */
  tints: {
    purple: ['rgba(125, 83, 230, 0.40)', 'rgba(57, 91, 242, 0.17)', 'rgba(95, 121, 198, 0)'],
    /** Pitaj astrologa: zlatno-zuta, iz `accent.yellow` ka toplijoj sredini (Ivan, 28.9.2026; ranije Tranziti). */
    gold: ['rgba(244, 200, 68, 0.40)', 'rgba(245, 158, 11, 0.17)', 'rgba(198, 160, 95, 0)'],
    /**
     * Natalna karta ("Ti"): crna/grafitna (Ivan, 26.9.2026: zelena se nije
     * uklapala). Providnosti su NIZE od ostalih (0,24 / 0,11): crna jacine ostalih
     * bi dala tesku sivu prugu preko bele kartice.
     */
    ink: ['rgba(20, 23, 27, 0.24)', 'rgba(60, 60, 70, 0.11)', 'rgba(60, 60, 70, 0)'],
    /** Tranziti: svetla nebesko-plava (Ivan, 28.9.2026; ranije Pitaj, pre toga Nebo). */
    blue: ['rgba(125, 211, 252, 0.40)', 'rgba(56, 189, 248, 0.17)', 'rgba(96, 165, 250, 0)'],
    /**
     * Natalna karta ("Ti"): indigo iz LOGA (`brand.indigo` #403F98), ka svetlijoj
     * #6366B4 u sredini (Ivan, 28.9.2026; izabran od tri predloga — lavanda,
     * breskva, indigo). Tamna boja, pa providnosti NIZE od ostalih (0,30 / 0,13),
     * kao nekad grafitna: jaca bi dala tesku prugu preko kartica.
     */
    indigo: ['rgba(64, 63, 152, 0.30)', 'rgba(99, 102, 180, 0.13)', 'rgba(99, 102, 180, 0)'],
    /** Bez preliva — providno. Natalna karta na BELOJ pozadini (Ivan, 26.9.2026); pretapa se kao i ostale. */
    none: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)'],
    /** Crvena iz `accent.red` — trenutno je nijedan ekran ne koristi (Nebo presao na `pink`, Ivan 28.9.2026). */
    red: ['rgba(235, 71, 67, 0.40)', 'rgba(220, 38, 38, 0.17)', 'rgba(230, 60, 60, 0)'],
    /**
     * Nebo: SVETLA roze iz aplikacije — `MINUS_BOJA` #F8B3C3 ("Koci te", oznaka
     * "izazovno"), ka malo zasicenijoj #F49AB8 u sredini (Ivan, 28.9.2026: "malo
     * svetlija"; bilo `accent.pink` #EB3C86, pre toga crvena). Providnost JACA od
     * ostalih, 0,60 / 0,26 ("bas je bledo") — svetla boja na 0,40 skoro nestane.
     */
    pink: ['rgba(248, 179, 195, 0.60)', 'rgba(244, 154, 184, 0.26)', 'rgba(244, 154, 184, 0)'],
  },
  /**
   * ZIVI PRELIV (Ivan, 28.9.2026): preko mirnog preliva plove dve meke mrlje
   * (elipse koje od sredine blede u nista), svaka svojim tempom — boja na vrhu
   * se polako preliva levo-desno, a preliv ostaje isti.
   *
   * Namerno SPORO i TIHO: aplikacija je bela strana za citanje, ne "kosmos".
   * Ako se pokret primeti pre teksta, prejak je — smanjuje se `sway`, ne brzina.
   */
  drift: {
    /**
     * Jedan krug sata, u ms. Mrlje ga obidju 2 odnosno 3 puta (18 s i 12 s
     * levo-desno). Ivan, 28.9.2026: "malo brze"; bilo 48000 (24 s i 16 s).
     */
    cycleMs: 36000,
    /** Koliko mrlja odlazi levo-desno od svog mesta, kao udeo sirine ekrana (Ivan, 28.9.2026: jace; bilo 0,3). */
    sway: 0.4,
    /** Koliko se mrlja dize i spusta, u pt. */
    lift: 12,
    /** Koliko mrlja "dise" — udeo velicine. */
    breathe: 0.08,
    /** Sirina mrlje kao udeo sirine ekrana. */
    width: 1.3,
    /**
     * Poluvisina mrlje i njen centar od vrha ekrana, u pt. Donja ivica, i kad
     * mrlja najvise naraste, mora ostati iznad `height` (230) — inace je preliv
     * odsece ravnom linijom.
     */
    radiusY: 150,
    centerY: 20,
  },
  /**
   * Mrlje po nijansi: boja i providnost u sredini. Boje su PRVE DVE boje iste
   * nijanse iz `tints` — nista novo; menja se samo gde stoje. Grafitna je slabija
   * iz istog razloga kao i njen preliv. Providnost 0,26 (Ivan, 28.9.2026: prvo
   * 0,24 pa "da se bolje vidi" 0,34, pa "previse je jako" — spusten je i mirni
   * preliv ispod, da pokret ostane vidljiv a ukupno bude svetlije).
   */
  blobs: {
    purple: [['rgb(125, 83, 230)', 0.26], ['rgb(57, 91, 242)', 0.26]],
    gold: [['rgb(244, 200, 68)', 0.26], ['rgb(245, 158, 11)', 0.26]],
    ink: [['rgb(20, 23, 27)', 0.11], ['rgb(60, 60, 70)', 0.11]],
    blue: [['rgb(125, 211, 252)', 0.26], ['rgb(56, 189, 248)', 0.26]],
    none: [],
    indigo: [['rgb(64, 63, 152)', 0.18], ['rgb(99, 102, 180)', 0.18]], // slabije, tamna boja
    red: [['rgb(235, 71, 67)', 0.26], ['rgb(220, 38, 38)', 0.26]],
    pink: [['rgb(248, 179, 195)', 0.38], ['rgb(244, 154, 184)', 0.38]], // jace, kao i preliv (svetla boja)
  },
} as const;

export type BackdropTint = keyof typeof backdrop.tints;

/**
 * Traka na vrhu ekrana — zamucuje ono sto klizi ispod nje.
 *
 * Visina je iz reference (53). Bila je privremeno 70 zbog loga, pa vracena na 53
 * (Ivan, 26.9.2026: "prevelika"); logo od 48pt se pomera navise da mu centar bude
 * na 22pt ispod statusne trake, kao native dugmad iOS trake. Statusna traka se
 * dodaje na nju, ne racuna se u nju: `insets.top + headerBar.height`.
 *
 * `intensity` NIJE prepis CSS-ovog `blur(16px)`. Na iOS-u `expo-blur` bira
 * sistemski materijal i `intensity` je udeo tog materijala (1-100), a ne
 * poluprecnik u pikselima — te dve lestvice nemaju vezu. Broj je zato IZABRAN
 * da lici, ne izmeren, i to je jedina vrednost u ovom fajlu za koju to vazi.
 *
 * Materijal je najtanji (`systemUltraThinMaterialLight`) jer referenca nema
 * nikakvu tintu — samo zamucenje. Deblji materijali dodaju belu koprenu i
 * traka pocne da izgleda kao neprovidna povrsina.
 */
export const headerBar = {
  /** Visina trake ISPOD statusne trake. */
  height: 53,
  /** Poluprecnik zamucenja u referenci — cuva se radi traga, ne koristi se direktno. */
  cssBlur: 16,
  /** Udeo sistemskog materijala na iOS-u (1-100), kad je traka puna. */
  intensity: 60,
  /**
   * Posle koliko pt klizanja zamucenje dostigne pun udeo.
   *
   * Na vrhu liste zamucenje je NULA. Dok ispod trake nema niceg, zamucivati
   * nema sta — traka tada samo posvetli prazan prostor i procita se kao siva
   * pruga preko preliva. Zamucenje se pali tek kad sadrzaj krene pod nju i
   * stigne na pun udeo posle ovoliko pt.
   *
   * Kratko namerno: duza rampa se cita kao da traka kasni za prstom.
   */
  blurAt: 24,
} as const;

export const tokens = { neutral, accent, brand, fontWeight, type, radius, space, size, shadow, backdrop, headerBar } as const;
