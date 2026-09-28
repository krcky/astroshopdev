/**
 * DEBLJINE PISMA — jedno mesto za SVE uloge teksta u aplikaciji.
 *
 * Svaka uloga (varijanta `<Text>`, natpis dugmeta, naslov uz logo, podnaslov
 * stavke u tumacenju, oznake na tocku…) dobija rez pisma: Regular, Medium
 * ili Bold (`theme/font.ts`; od 28.9.2026 Plus Jakarta Sans, pre toga Satoshi).
 * Tabela je procenjena na Satoshiju i preneta na Jakartu bez izmena. Nijedan ekran ne pise `font-semibold` sam —
 * uzima `tezina('uloga')`, pa se cela hijerarhija menja ovde.
 *
 * POVRATAK — sacuvana stanja, za svako je dovoljno `export const TEZINE = …`:
 *   TEZINE_SATOSHI_1    odmah po prelasku na Satoshi (semibold -> Bold)
 *   TEZINE_HIJERARHIJA  posle procene hijerarhije, tekst za citanje jos Regular
 *   TEZINE_SATOSHI      poslednje stanje na Satoshiju (tekst za citanje Medium)
 *   TEZINE_JAKARTA      Plus Jakarta Sans, cetiri nivoa 800/700/600/500 ("predebelo")
 *   TEZINE_JAKARTA_LAKSE AKTIVNO — naslovi 600, sve ostalo 500
 */
import { FONT } from '@/theme/font';

/** Rezovi: 400, 500, 600, 700, 800. Stara stanja (Satoshi) koriste samo tri. */
export type Rez = 'regular' | 'medium' | 'semibold' | 'bold' | 'extrabold';

/** Pune klase, da ih Tailwind nadje pri gradnji (dinamicki sklopljena klasa ne postoji). */
const KLASA: Record<Rez, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
  extrabold: 'font-extrabold',
};

export type Uloga =
  /* varijante `<Text>` */
  | 'display' | 'title' | 'section' | 'nav' | 'row' | 'h3' | 'label' | 'chip' | 'tab' | 'question'
  | 'default' | 'body' | 'reading' | 'muted' | 'caption' | 'lead' | 'note'
  /* uloge van varijanti */
  | 'dugme'            // natpis u dugmetu
  | 'chipIzabran'      // izabrana kapsula
  | 'naslovStrane'     // "Tranziti", "Ti"… uz logo u traci (24pt)
  | 'heroNaslov'       // naslov tranzita dana, besplatni Hero (24pt)
  | 'naslovSlajda'     // naslov slajda na pocetnoj ("Danas ukratko", "Tema perioda"), velicina `display`
  | 'kalendarBroj'     // broj dana u kalendaru "Promene na nebu" (26pt)
  | 'naslovStavke'     // naslov stavke u listi tumacenja ("• Iskrenost u odnosima"), nad sivim tekstom
  | 'naslovUTekstu'    // podebljan pocetak u CRNOM tekstu kartice ("Jasni ciljevi: …" na "Tvom danu", "Mesec danas")
  | 'statOznaka'       // verzal oznaka nad podatkom na ekranu Mesec
  | 'oblast'           // naziv oblasti u kartici ocena
  | 'ugao'             // "Asc" / "MC" u kruzicu simbola
  | 'izabranRed'       // izabrano mesto na /sky-place
  | 'tabTraka'         // natpisi na traci tabova
  | 'karticaOznaka'    // verzal nad naslovom kartice tranzita ("VENERA KONJUNKCIJA MESEC")
  | 'karticaNaslov'    // naslov tumacenja na kartici tranzita
  | 'tockStepen' | 'tockMinut' | 'tockUgao' | 'tockKuca'; // tocak natalne karte

/**
 * STANJE 28.9.2026, prvi Satoshi — sacuvano za povratak. Ovako je izgledalo
 * odmah posle zamene pisma: `font-semibold` (600) -> Bold jer Satoshi nema 600.
 */
export const TEZINE_SATOSHI_1: Record<Uloga, Rez> = {
  display: 'bold', title: 'bold', section: 'bold', nav: 'bold', row: 'medium', h3: 'bold',
  label: 'medium', chip: 'medium', tab: 'medium', question: 'medium',
  default: 'regular', body: 'regular', reading: 'regular', muted: 'regular', caption: 'regular',
  lead: 'regular', note: 'regular',
  dugme: 'bold', chipIzabran: 'bold', naslovStrane: 'bold', heroNaslov: 'bold', naslovSlajda: 'bold', kalendarBroj: 'bold',
  naslovStavke: 'bold', naslovUTekstu: 'bold', statOznaka: 'bold', oblast: 'medium', ugao: 'bold', izabranRed: 'bold',
  tabTraka: 'medium', tockStepen: 'bold', tockMinut: 'regular', tockUgao: 'bold', tockKuca: 'regular',
  karticaOznaka: 'medium', karticaNaslov: 'bold',
};

/**
 * STANJE 28.9.2026, procena hijerarhije na `/dev-tipografija` — sacuvano za povratak. Pravilo: Bold
 * nose samo NASLOVI (display, title, h2, h3, naslov uz logo) i glavno dugme;
 * sve sto stoji UNUTAR naslova ili teksta ide jedan korak nize. Razlike u
 * odnosu na `TEZINE_SATOSHI_1`:
 *   nav          Bold -> Medium  naslov u traci ne sme da se tuce sa velikim
 *                                naslovom strane ispod (profil, Mesec, mesto)
 *   naslovStavke Bold -> Medium  u listu tumacenja podnaslov stavke je bio JACI
 *                                od naslova odeljka iznad (siv `label`) —
 *                                hijerarhija je bila naopako; crna boja ga i
 *                                ovako odvaja od sivog teksta
 *   statOznaka   Bold -> Medium  "MESEC / ZNAK" bile su iste tezine kao
 *                                vrednosti iznad — oznaka mora biti tisa
 *   ugao         Bold -> Medium  "Asc" / "MC" u kruzicu uz tanke simbole
 * Probano i vraceno: dugme u Medium-u — na punom crnom dugmetu ("Nastavi")
 * natpis je delovao slabo, pa ostaje Bold.
 */
export const TEZINE_HIJERARHIJA: Record<Uloga, Rez> = {
  ...TEZINE_SATOSHI_1,
  nav: 'medium',
  naslovStavke: 'medium',
  naslovUTekstu: 'medium',
  statOznaka: 'medium',
  ugao: 'medium',
};

/**
 * POSLEDNJE STANJE NA SATOSHIJU (28.9.2026) — sacuvano za povratak (Ivan:
 * "zapamti debljine kakve su bile na Satoshiju"). Tekst za citanje podebljan (Ivan: "malo da
 * podebljas sav tekst za citanje"). Satoshi nema rez izmedju 400 i 500, pa je
 * "malo" = Regular -> Medium. Posledice po hijerarhiji, resene ovde:
 *   naslovUTekstu Medium -> Bold  u crnom tekstu kartice Medium naslov vise ne
 *                                 bi odskakao od Medium teksta
 *   naslovStavke  ostaje Medium    nad SIVIM tekstom ga odvaja crna boja; Bold bi
 *                                 opet bio jaci od naslova odeljka iznad
 */
export const TEZINE_SATOSHI: Record<Uloga, Rez> = {
  ...TEZINE_HIJERARHIJA,
  default: 'medium', body: 'medium', reading: 'medium', muted: 'medium', caption: 'medium',
  lead: 'medium', note: 'medium',
  naslovUTekstu: 'bold',
};

/**
 * PLUS JAKARTA SANS (Ivan, 28.9.2026: "svi su iste debljine" — pojacaj i odvoj po
 * hijerarhiji). Na Satoshiju su bila dva nivoa: tekst Medium, sve iznad Bold, a
 * Jakartin Medium i Bold su blizi nego Satoshijevi — pa se sve slilo. Sada su
 * CETIRI nivoa, svaki jedan rez iznad prethodnog:
 *
 *   800 ExtraBold  NASLOVI STRANE I EKRANA: display, title, section, naslov uz
 *                  logo, naslov tranzita dana — prvo sto oko uhvati
 *   700 Bold       podnaslovi i radnja: h3, naslov u traci unutrasnje strane,
 *                  dugme, izabrana kapsula, izabran red, podebljan pocetak u
 *                  crnom tekstu, broj u kalendaru, stepen na tocku
 *   600 SemiBold   IMENA STVARI u listi i oznake: red, naslov grupe, kapsula,
 *                  pitanje u onboardingu, naslov stavke tumacenja, oblast,
 *                  oznaka podatka, Asc/MC, natpisi tabova
 *   500 Medium     TEKST: sve sto se cita (nepromenjeno od Satoshija)
 *
 * `nav` je jedan nivo ispod naslova strane (700 prema 800), pa se i dalje ne tuce
 * sa velikim naslovom ispod. `naslovStavke` (600, crn) ostaje ispod naslova
 * odeljka iznad sebe, iako je `label` isto 600 — `label` je siv, pa ga odvaja boja.
 * Regular (400) ostaje samo za minute i kuce na tocku, gde je sitno i sivo.
 */
export const TEZINE_JAKARTA: Record<Uloga, Rez> = {
  display: 'extrabold', title: 'extrabold', section: 'extrabold',
  naslovStrane: 'extrabold', heroNaslov: 'extrabold', naslovSlajda: 'extrabold',

  h3: 'bold', nav: 'bold', dugme: 'bold', chipIzabran: 'bold', izabranRed: 'bold',
  naslovUTekstu: 'bold', kalendarBroj: 'bold', tockStepen: 'bold', tockUgao: 'bold',

  row: 'semibold', label: 'semibold', chip: 'semibold', question: 'semibold', tab: 'semibold',
  naslovStavke: 'semibold', oblast: 'semibold', statOznaka: 'semibold', ugao: 'semibold',
  tabTraka: 'semibold',

  default: 'medium', body: 'medium', reading: 'medium', muted: 'medium', caption: 'medium',
  lead: 'medium', note: 'medium',

  tockMinut: 'regular', tockKuca: 'regular',
  karticaOznaka: 'semibold', karticaNaslov: 'extrabold',
};

/**
 * JAKARTA, LAKSE (Ivan, 28.9.2026: "mnogo su debeli ovi debeli fontovi, smanji za
 * dva stepena"). Najdeblji rez pada za dva stepena (ExtraBold 800 -> SemiBold 600).
 * Ostali ne mogu za dva: Bold (700) bi pao na Medium (500), istu debljinu kao
 * tekst, i "Ide ti" ili dugme bi bili TANJI od imena oblasti (600) — hijerarhija
 * naopako. Zato se sve spusta tako da redosled ostane:
 *
 *   600 SemiBold  naslovi, podnaslovi, dugme, podebljan pocetak u tekstu
 *                 (bilo 800 i 700) — naslove od podnaslova sada odvaja velicina
 *   500 Medium    imena stvari i oznake (bilo 600) i sav tekst
 *
 * Imena stvari (red, oblast, kapsula) od teksta odvajaju velicina i crna boja
 * naspram sive. Prethodno, teze stanje: `TEZINE_JAKARTA`.
 */
export const TEZINE_JAKARTA_LAKSE: Record<Uloga, Rez> = {
  display: 'semibold', title: 'semibold', section: 'semibold',
  // Naslovi strana u zaglavlju: ista debljina kao naslov na kartici tranzita (Ivan, 28.9.2026:
  // "ova debljina za sve naslove svih stranica u hederu") — uz logo na tabovima i u traci unutrasnjih strana.
  naslovStrane: 'bold', heroNaslov: 'semibold',
  // Naslovi slajdova na pocetnoj tanji od ostalih naslova (Ivan, 28.9.2026: "smanji
  // debljinu tim naslovima"); od kartice ih odvajaju velicina (32pt) i vazduh.
  naslovSlajda: 'medium',

  h3: 'semibold', nav: 'bold', dugme: 'semibold', chipIzabran: 'semibold', izabranRed: 'semibold',
  naslovUTekstu: 'semibold', kalendarBroj: 'semibold', tockStepen: 'semibold', tockUgao: 'semibold',

  row: 'medium', label: 'medium', chip: 'medium', question: 'medium', tab: 'medium',
  naslovStavke: 'medium', oblast: 'medium', statOznaka: 'medium', ugao: 'medium',
  tabTraka: 'medium',

  default: 'medium', body: 'medium', reading: 'medium', muted: 'medium', caption: 'medium',
  lead: 'medium', note: 'medium',

  tockMinut: 'regular', tockKuca: 'regular',

  /* Kartica tranzita po uzoru (Ivan, 28.9.2026, snimak "SEP 18–OCT 31 / Grow the Roots"):
     naslov Bold — jedini Bold u ovoj tabeli, jer na uzoru naslov jasno nosi vise
     od oznake iznad. Velicine: 11 i 24 (~0,45). Oznaka je posle podebljana na Bold
     i vracena na obican razmak slova (Ivan, 28.9.2026). */
  // Naslov kartice posle spusten jedan stepen, Bold -> SemiBold (Ivan, 28.9.2026).
  karticaOznaka: 'bold', karticaNaslov: 'semibold',
};

/**
 * AKTIVNA tabela. Povratak: `TEZINE_JAKARTA` (teze, cetiri nivoa) ili
 * `TEZINE_SATOSHI` (uz `FONT_SATOSHI` u `theme/font.ts`).
 */
export const TEZINE: Record<Uloga, Rez> = TEZINE_JAKARTA_LAKSE;

/** Klasa tezine za ulogu — za `className`. */
export const tezina = (u: Uloga) => KLASA[TEZINE[u]];

/** Familija za ulogu — za mesta bez klasa (SVG tekst, `labelStyle` tabova). */
export const fontUloge = (u: Uloga) => FONT[TEZINE[u]];
