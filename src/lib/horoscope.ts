/**
 * Composer — sklapa dnevni tekst iz astro dogadjaja.
 *
 * ARHITEKTURA: ovde se prikljucuje korpus od 800 strana.
 * Sada je CORPUS stub objekat u kodu; u produkciji je Postgres tabela
 * `snippets(content_key, variant, text, life_area, tone)` i ova funkcija
 * postaje SQL upit. Potpis funkcija se NE menja — samo izvor podataka.
 *
 * Korpus nikad ne ide na klijenta. Ovo se izvrsava na serveru; app dobija
 * samo gotov tekst za taj dan.
 */
import { findAspects, planetPositions, moonPhase, type Aspect } from '@/lib/astro';
import { findTransits, findHouseTransits, type Transit } from '@/lib/transits';
import type { ResolvedProfile } from '@/store/profile';
import type { ZodiacSign } from '@/lib/zodiac';

/** Stub korpusa. Kljucevi su isti format koji generise findAspects(). */
const CORPUS: Record<string, string[]> = {
  'moon.trine.pluto': [
    'Danas ti intuicija radi dublje nego obično. Ono što si nedeljama slutio o jednoj osobi ili situaciji izlazi na površinu — i nećeš moći da se pretvaraš da ne vidiš.',
  ],
  'moon.sextile.neptune': [
    'Granica između osećanja i maštanja tanja ti je nego inače. Odlično za sve što stvaraš, opasno za odluke koje uključuju novac.',
  ],
  'mars.square.saturn': [
    'Naići ćeš na otpor tamo gde si očekivao da ide glatko. Ne guraj jače — Saturn ne popušta na silu, nego na strpljenje.',
  ],
  'jupiter.trine.saturn': [
    'Redak sklad između smelosti i discipline. Ako imaš plan koji odlažeš mesecima, ovo je nedelja da mu daš prvi konkretan korak.',
  ],
  'moon.conjunction.uranus': [
    'Nemir bez jasnog razloga. Umesto da ga gasiš, daj mu nešto novo da radi — promena rutine danas vredi više od odmora.',
  ],
};

const FALLBACK =
  'Nebo je danas mirno za tvoj znak. Dani bez jakih aspekata su oni u kojima se vidi šta si sam izgradio — koristi ih za ono što si odlagao.';

export type DailyHoroscope = {
  date: Date;
  sign: ZodiacSign;
  /** Kratak pregled neba — prikazuje se i besplatnim korisnicima. */
  skyline: string;
  /** Besplatni deo: prvi pasus. */
  free: string;
  /** Placeni deo: ostatak. */
  premium: string[];
  /** Dogadjaji od kojih je tekst nastao — korisno za debug i "zasto ovo pise". */
  events: Aspect[];
};

export function buildDailyHoroscope(sign: ZodiacSign, date: Date = new Date()): DailyHoroscope {
  const positions = planetPositions(date);
  const aspects = findAspects(positions);
  const moon = positions.find((p) => p.key === 'moon')!;
  const phase = moonPhase(date);

  // Selektor: uzmi najjace dogadjaje koji imaju tekst u korpusu.
  const chosen = aspects.filter((a) => CORPUS[a.contentKey]?.length).slice(0, 4);

  const paragraphs = chosen.map((a) => {
    const variants = CORPUS[a.contentKey];
    // Deterministicna rotacija varijanti po danu — isti dan uvek isti tekst,
    // ali se varijante smenjuju kroz vreme da se ne ponavlja.
    const dayIndex = Math.floor(date.getTime() / 86_400_000);
    return variants[dayIndex % variants.length];
  });

  const retro = positions.filter((p) => p.retrograde && p.key !== 'moon');

  return {
    date,
    sign,
    skyline:
      `Mesec u znaku ${moon.position.sign.name} · ${phase.name}` +
      (retro.length ? ` · retrogradni: ${retro.map((r) => r.name).join(', ')}` : ''),
    free: paragraphs[0] ?? FALLBACK,
    premium: paragraphs.slice(1),
    events: chosen,
  };
}

const DANI = ['nedelja', 'ponedeljak', 'utorak', 'sreda', 'četvrtak', 'petak', 'subota'];
const MESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

export function formatDate(date: Date): string {
  const s = `${DANI[date.getDay()]}, ${date.getDate()}. ${MESECI[date.getMonth()]}`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}


/* ------------------------------------------------------------------------- *
 * PERSONALIZOVANI HOROSKOP — tranziti na natalnu kartu.
 * Ovo je placeni sadrzaj: jedinstven po korisniku, ne po znaku.
 * ------------------------------------------------------------------------- */

/**
 * Stub korpusa za tranzite. Kljucevi su isti format koji generise findTransits().
 * U produkciji: `SELECT text FROM snippets WHERE content_key = $1`.
 */
const TRANSIT_CORPUS: Record<string, string[]> = {
  'transit.uranus.conjunction.natal.mercury': [
    'Način na koji misliš menja se brže nego što stigneš da primetiš. Ideja koja ti danas deluje neozbiljno za mesec dana biće ono čime se baviš.',
  ],
  'transit.mars.trine.natal.moon': [
    'Osećanja i akcija idu u istom smeru, što ti se ne dešava često. Ono što danas kreneš iz stomaka, ispašće tačno.',
  ],
  'transit.mars.square.natal.ascendant': [
    'Naletećeš na nekoga ko ti se suprotstavlja direktno. Nije lično — proveri da li braniš stav ili samo teritoriju.',
  ],
  'transit.saturn.square.natal.neptune': [
    'Nešto u šta si verovao pokazuje svoje stvarne granice. Nije gubitak iluzije nego njeno preciziranje.',
  ],
  'transit.venus.trine.natal.sun': [
    'Lakše te vide onakvog kakav jesi. Dobar dan da tražiš nešto što inače ne bi tražio.',
  ],
};

export type PersonalEntry = {
  transit: Transit;
  /** null = nema jos teksta u korpusu za ovaj kljuc. */
  text: string | null;
};

export type PersonalDaily = {
  date: Date;
  name: string;
  /** Kratak pregled neba — isti za sve. */
  skyline: string;
  /** Besplatno: jedan pasus prema suncevom znaku. */
  free: string;
  /** Placeno: tranziti na licnu kartu. */
  entries: PersonalEntry[];
  /** Kroz koje natalne kuce prolaze spore planete danas. */
  houseHighlights: { house: number; planetName: string; glyph: string; contentKey: string }[];
};

export function buildPersonalDaily(
  resolved: ResolvedProfile,
  date: Date = new Date()
): PersonalDaily {
  const sunSign = resolved.chart.planets.find((p) => p.key === 'sun')!.position.sign;
  const generic = buildDailyHoroscope(sunSign, date);

  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  const entries: PersonalEntry[] = findTransits(resolved.chart, date)
    .slice(0, 5)
    .map((transit) => {
      const variants = TRANSIT_CORPUS[transit.contentKey];
      return {
        transit,
        text: variants?.length ? variants[dayIndex % variants.length] : null,
      };
    });

  const houseHighlights = findHouseTransits(resolved.chart, date)
    .filter((t) => t.score >= 0.9) // samo spore planete — one prave temu perioda
    .slice(0, 3)
    .map((t) => ({
      house: t.house,
      planetName: t.transiting.name,
      glyph: t.transiting.glyph,
      contentKey: t.contentKey,
    }));

  return {
    date,
    name: resolved.profile.name,
    skyline: generic.skyline,
    free: generic.free,
    entries,
    houseHighlights,
  };
}
