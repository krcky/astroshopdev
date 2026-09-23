/**
 * Izracunate tacke — cvor, Lilit, Tacka srece.
 *
 * Ovo NISU nebeska tela nego geometrija: presek dve ravni, tacka orbite i
 * odnos tri ugla. `astronomy-engine` ih ne daje kao `Body`, pa se racunaju
 * ovde — ali po istom pravilu kao sve ostalo: longitude su u ECT (prava
 * ekliptika datuma), nikad u J2000.
 *
 * NAMERNO ODVOJENO OD `BODIES` u `astro.ts`. Da su tamo, ušle bi u natalnu
 * kartu, u `findAspects()` i u dnevne tranzite — a za njihove aspekte korpus
 * nema nijedan tekst, pa bi dnevni horoskop dobio gomilu praznih redova.
 * Ove tacke se za sada samo PRIKAZUJU, na ekranu "Trenutno na nebu".
 *
 * Kiron ovde nema mesta: nije ni telo iz `astronomy-engine` ni geometrijska
 * tacka, nego asteroid kome treba zasebna efemerida.
 */
import * as Astronomy from 'astronomy-engine';
import { norm360, signFromLongitude, type SignPosition } from '@/lib/zodiac';

const RAD = 180 / Math.PI;

export type PointKey = 'northNode' | 'lilith' | 'fortune';

export type SkyPoint = {
  key: PointKey;
  name: string;
  glyph: string;
  longitude: number;
  position: SignPosition;
  /** Kuca u kojoj tacka lezi. Popunjava je `lib/sky.ts`, jer trazi kuspide. */
  house?: number;
  /**
   * Kretanje unazad. Postoji samo kod cvora — Lilit i Tacka srece se ovako ne
   * opisuju: srednji apogej uvek ide napred, a Tacka srece prati ascendent.
   */
  retrograde?: boolean;
};

/**
 * Severni (uzlazni) mesecev cvor — PRAVI, ne srednji.
 *
 * Cvor je presek Meseceve orbitalne ravni sa ekliptikom. Ravan se dobija iz
 * vektora ugaonog momenta H = r x v: on je normala na orbitu, pa je pravac
 * uzlaznog cvora z x H, odnosno (-Hy, Hx).
 *
 * Racuna se u EQJ (fiksna ravan), pa se tek H rotira u ekliptiku datuma.
 * Da se svaki polozaj posebno rotirao, u brzinu bi ušlo i okretanje samog
 * koordinatnog sistema.
 *
 * SREDNJI cvor (polinom iz Meeusa) odstupa i do 1,8° — na 23.9.2026. razlika
 * je 1,5°, sto je ceo jedan znak kad je cvor pri kraju znaka. Zapadni softver
 * (astro.com, astro-seek) podrazumevano prikazuje pravi cvor, pa ga i mi.
 */
export function trueNodeLongitude(date: Date): number {
  const t = Astronomy.MakeTime(date);
  const h = 0.001; // dana — dovoljno malo za stabilan izvod, dovoljno veliko da ne šumi

  const eqj = (time: Astronomy.AstroTime) => {
    const v = Astronomy.GeoMoon(time);
    return [v.x, v.y, v.z];
  };
  const p = eqj(t);
  const pre = eqj(t.AddDays(-h));
  const posle = eqj(t.AddDays(h));
  const v = [0, 1, 2].map((i) => (posle[i] - pre[i]) / (2 * h));

  // Ugaoni moment r x v — normala na orbitalnu ravan.
  const H = new Astronomy.Vector(
    p[1] * v[2] - p[2] * v[1],
    p[2] * v[0] - p[0] * v[2],
    p[0] * v[1] - p[1] * v[0],
    t
  );
  const ect = Astronomy.RotateVector(Astronomy.Rotation_EQJ_ECT(t), H);

  return norm360(Math.atan2(ect.x, -ect.y) * RAD);
}

/**
 * Lilit (crni Mesec) — SREDNJI apogej Meseceve orbite.
 *
 * Apogej je tacno nasuprot perigeja, a srednja longituda perigeja je polinom
 * iz Meeusa (Astronomical Algorithms, pogl. 47), sa T u julijanskim vekovima
 * TT od J2000.
 *
 * "Srednji" a ne "pravi" je ovde standard: pravi (oskulirajuci) apogej osciluje
 * i do 30° oko srednjeg i skace napred-nazad iz dana u dan. Provera na
 * 23.9.2026. daje razliku od 6,5' u odnosu na astro-seek — programi se oko
 * srednjeg apogeja razilaze za desetinku stepena jer koriste razlicite serije
 * lunarne teorije. Pravi apogej je istog dana 11° dalje, pa je jasno da je
 * srednji prava varijanta.
 */
/**
 * Brzina cvora u stepenima po danu. Negativno = unazad.
 *
 * Pravi cvor NIJE uvek retrogradan — oko srednjeg kretanja (-0,053°/dan)
 * osciluje toliko da po nekoliko dana mesecno ide napred. Zato se oznaka "R"
 * racuna, a ne pretpostavlja: na 23.9.2026. cvor je direktan, i astro-seek ga
 * tog dana takodje prikazuje bez "R".
 */
export function nodeSpeed(date: Date): number {
  const dt = 0.5; // pola dana, kao i kod planeta u `astro.ts`
  const pre = trueNodeLongitude(new Date(date.getTime() - (dt / 2) * 86400_000));
  const posle = trueNodeLongitude(new Date(date.getTime() + (dt / 2) * 86400_000));
  let d = posle - pre;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d / dt;
}

export function meanLilithLongitude(date: Date): number {
  const T = Astronomy.MakeTime(date).tt / 36525;
  const perigej =
    83.3532465 +
    4069.0137287 * T -
    0.0103200 * T * T -
    (T * T * T) / 80053 +
    (T * T * T * T) / 18999000;
  return norm360(perigej + 180);
}

/**
 * Tacka srece — jedini arapski deo koji se i danas svuda prikazuje.
 *
 * Dnevna karta:  ASC + Mesec - Sunce
 * Nocna karta:   ASC + Sunce - Mesec
 *
 * Formula se OBRCE nocu i to nije sitnica — razlika je po pravilu vise
 * desetina stepeni, dakle drugi znak i druga kuca. Dan je kad je Sunce iznad
 * horizonta, tj. u kucama 7—12.
 */
export function partOfFortuneLongitude(
  ascendant: number,
  sunLongitude: number,
  moonLongitude: number,
  dnevnaKarta: boolean
): number {
  return dnevnaKarta
    ? norm360(ascendant + moonLongitude - sunLongitude)
    : norm360(ascendant + sunLongitude - moonLongitude);
}

/** Sunce iznad horizonta = dnevna karta. Kuce 7—12 su nad horizontom. */
export function isDayChart(sunHouse: number): boolean {
  return sunHouse >= 7;
}

/**
 * Imena i simboli. Stoje kao literali jer skripta za font
 * (`scripts/font/build-astroglyphs.py`) cita bas ovaj oblik — `glyph: '...'` —
 * da bi znala koje znakove mora da ubaci u `AstroGlyphs.ttf`.
 */
export const POINTS: { key: PointKey; name: string; glyph: string }[] = [
  { key: 'northNode', name: 'Severni čvor', glyph: '☊\uFE0E' },
  { key: 'lilith',    name: 'Lilit',        glyph: '⚸\uFE0E' },
  { key: 'fortune',   name: 'Tačka sreće',  glyph: '⊗\uFE0E' },
];

/** Sve tri tacke za dati trenutak. Kucu dodeljuje pozivalac — ona trazi kuspide. */
export function computeSkyPoints(
  date: Date,
  ascendant: number,
  sunLongitude: number,
  moonLongitude: number,
  dnevnaKarta: boolean
): SkyPoint[] {
  const longitude: Record<PointKey, number> = {
    northNode: trueNodeLongitude(date),
    lilith: meanLilithLongitude(date),
    fortune: partOfFortuneLongitude(ascendant, sunLongitude, moonLongitude, dnevnaKarta),
  };

  return POINTS.map((def) => ({
    ...def,
    longitude: longitude[def.key],
    position: signFromLongitude(longitude[def.key]),
    retrograde: def.key === 'northNode' ? nodeSpeed(date) < 0 : undefined,
  }));
}
