/**
 * Ephemeris sloj — astronomy-engine (MIT, +-1 lucni minut).
 *
 * Sve longitude su u ECT: prava ekliptika datuma (true equinox of date).
 * To je referentni sistem TROPSKOG zodijaka, koji koristi zapadna astrologija.
 * NE koristiti Astronomy.Ecliptic() — on vraca J2000, sto danas odstupa ~0.36 stepeni
 * zbog precesije i pomerilo bi svaku poziciju.
 */
import * as Astronomy from 'astronomy-engine';
import { tr, type Recnik } from '@/i18n/jezik';
import { norm360, signFromLongitude, type SignPosition } from '@/lib/zodiac';

export type PlanetKey =
  | 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'
  | 'jupiter' | 'saturn' | 'uranus' | 'neptune' | 'pluto';

type BodyDef = {
  key: PlanetKey;
  body: Astronomy.Body;
  /** Ime na jeziku aplikacije (getter, iz recnika). */
  readonly name: string;
  glyph: string;
  /** Tezina u odabiru sadrzaja: brza tela nose dnevni ton, spora nose kontekst. */
  weight: number;
};

/** Ime se cita iz recnika u trenutku citanja (getter), da prati jezik. */
function telo(d: Omit<BodyDef, 'name'>): BodyDef {
  return { ...d, get name() { return tr().nebo.tela[d.key]; } };
}

export const BODIES: BodyDef[] = [
  telo({ key: 'moon', body: Astronomy.Body.Moon, glyph: '☽\uFE0E', weight: 1.0 }),
  telo({ key: 'sun', body: Astronomy.Body.Sun, glyph: '☉\uFE0E', weight: 1.0 }),
  telo({ key: 'mercury', body: Astronomy.Body.Mercury, glyph: '☿\uFE0E', weight: 0.8 }),
  telo({ key: 'venus', body: Astronomy.Body.Venus, glyph: '♀\uFE0E', weight: 0.8 }),
  telo({ key: 'mars', body: Astronomy.Body.Mars, glyph: '♂\uFE0E', weight: 0.8 }),
  telo({ key: 'jupiter', body: Astronomy.Body.Jupiter, glyph: '♃\uFE0E', weight: 0.6 }),
  telo({ key: 'saturn', body: Astronomy.Body.Saturn, glyph: '♄\uFE0E', weight: 0.6 }),
  telo({ key: 'uranus', body: Astronomy.Body.Uranus, glyph: '♅\uFE0E', weight: 0.4 }),
  telo({ key: 'neptune', body: Astronomy.Body.Neptune, glyph: '♆\uFE0E', weight: 0.4 }),
  telo({ key: 'pluto', body: Astronomy.Body.Pluto, glyph: '♇\uFE0E', weight: 0.4 }),
];

/** Geocentricna ekliptička longituda tela, u ekliptici datuma. */
function eclipticLongitude(body: Astronomy.Body, time: Astronomy.AstroTime): number {
  const eqj = Astronomy.GeoVector(body, time, true); // true = korekcija za aberaciju
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(time), eqj);
  return norm360(Astronomy.SphereFromVector(ect).lon);
}

/** Longituda jednog tela u datom trenutku — za racun dokle tranzit traje. */
export function bodyLongitude(key: PlanetKey, date: Date): number {
  const def = BODIES.find((b) => b.key === key)!;
  return eclipticLongitude(def.body, Astronomy.MakeTime(date));
}

/** Razlika dva ugla svedena na (-180, 180]. */
function angleDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

export type PlanetPosition = {
  key: PlanetKey;
  readonly name: string;
  glyph: string;
  weight: number;
  longitude: number;
  position: SignPosition;
  /** Stepeni po danu. Negativno = retrogradno kretanje. */
  speed: number;
  retrograde: boolean;
};

export function planetPositions(date: Date = new Date()): PlanetPosition[] {
  const t0 = Astronomy.MakeTime(date);
  const dt = 0.5; // pola dana — dovoljno za stabilnu brzinu i kod sporih tela
  const t1 = t0.AddDays(dt);

  return BODIES.map(({ key, body, glyph, weight }) => {
    const l0 = eclipticLongitude(body, t0);
    const l1 = eclipticLongitude(body, t1);
    const speed = angleDelta(l1, l0) / dt;
    return {
      key, glyph, weight,
      get name() { return tr().nebo.tela[key]; },
      longitude: l0,
      position: signFromLongitude(l0),
      speed,
      retrograde: speed < 0,
    };
  });
}

export type AspectDef = {
  key: string;
  /** Ime na jeziku aplikacije (getter, iz recnika). */
  readonly name: string;
  angle: number;
  glyph: string;
  /** Maksimalna dozvoljena orbita u stepenima. */
  orb: number;
};

function aspekt(d: Omit<AspectDef, 'name'> & { key: keyof Recnik['nebo']['aspekti'] }): AspectDef {
  return { ...d, get name() { return tr().nebo.aspekti[d.key]; } };
}

export const ASPECTS: AspectDef[] = [
  aspekt({ key: 'conjunction', angle: 0, glyph: '☌\uFE0E', orb: 8 }),
  aspekt({ key: 'sextile', angle: 60, glyph: '⚹\uFE0E', orb: 4 }),
  aspekt({ key: 'square', angle: 90, glyph: '□\uFE0E', orb: 6 }),
  aspekt({ key: 'trine', angle: 120, glyph: '△\uFE0E', orb: 6 }),
  aspekt({ key: 'opposition', angle: 180, glyph: '☍\uFE0E', orb: 8 }),
];

export type Aspect = {
  a: PlanetPosition;
  b: PlanetPosition;
  aspect: AspectDef;
  /** Odstupanje od tacnog ugla, u stepenima. Manje = jace. */
  orb: number;
  /** Aspekt se pojacava (planete se priblizavaju tacnom uglu). */
  applying: boolean;
  /**
   * 0—1, koliko je ovaj dogadjaj "jak". Kombinuje tesnocu orbite i tezinu tela.
   * Selektor sadrzaja sortira po ovome i uzima top N.
   */
  score: number;
  /**
   * Kanonski kljuc za bazu tekstova, npr. "mars.square.venus".
   * Tela su uvek u redosledu iz BODIES da kljuc bude deterministican.
   */
  contentKey: string;
};

export function findAspects(positions: PlanetPosition[]): Aspect[] {
  const out: Aspect[] = [];

  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i];
      const b = positions[j];
      const separation = Math.abs(angleDelta(a.longitude, b.longitude));

      for (const aspect of ASPECTS) {
        const orb = Math.abs(separation - aspect.angle);
        if (orb > aspect.orb) continue;

        // Da li se ugao smanjuje? Uporedi orbitu sada i za sat vremena.
        const future = Math.abs(
          Math.abs(angleDelta(a.longitude + a.speed / 24, b.longitude + b.speed / 24)) - aspect.angle
        );

        const tightness = 1 - orb / aspect.orb;
        out.push({
          a, b, aspect, orb,
          applying: future < orb,
          score: tightness * ((a.weight + b.weight) / 2),
          contentKey: `${a.key}.${aspect.key}.${b.key}`,
        });
        break; // dva tela mogu imati najvise jedan aspekt
      }
    }
  }

  return out.sort((x, y) => y.score - x.score);
}

/** Faza Meseca u stepenima (0 = mlad, 90 = prva cetvrt, 180 = pun). */
export function moonPhase(date: Date = new Date()): { angle: number; name: string } {
  const angle = Astronomy.MoonPhase(date);
  return { angle, name: tr().nebo.fazeMeseca[Math.floor(norm360(angle + 22.5) / 45)] };
}
