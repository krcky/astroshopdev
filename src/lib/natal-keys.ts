/**
 * Kljucevi tekstova NATALNE karte (`natal_texts`) za kartu korisnika.
 *
 *   natal.<telo>.sign.<znak>     Sunce u Ovnu          (znak = SIGNS[].key)
 *   natal.ascendant.sign.<znak>  podznak
 *   natal.<telo>.house.<N>       Sunce u 5. kuci
 *   natal.<a>.<aspekt>.<b>       'natal.' + contentKey iz `findAspects()`;
 *                                aspekt na Ascendent: Ascendent je uvek drugi
 *
 * Isti oblik pravi `scripts/korpus/natal.py` — NE MENJATI posle uvoza.
 * Aspekata na MC NEMA (Ivan, 28.9.2026).
 *
 * RADIJE PRIZNATI NEGO POGADJATI (pravila 4 i 5). Bez vremena rodjenja:
 *   - nema podznaka, kuca ni aspekata na Ascendent — izracunati su za podne;
 *   - Mesec se za 24 sata pomeri ~13°: znak se daje samo ako je CEO DAN
 *     rodjenja u istom znaku, a Mesecevi aspekti se ne tumace (orbis je
 *     nepoznat i do ±7°, pa aspekt mozda i ne postoji).
 *
 * Cist racun, bez RN uvoza (pravilo 6); provera u `scripts/check-natal-tekst.ts`.
 */
import { ASPECTS, bodyLongitude, findAspects, type Aspect } from '@/lib/astro';
import type { NatalChart } from '@/lib/natal';
import { signFromLongitude, type ZodiacSign } from '@/lib/zodiac';

/** Besplatno (Ivan, 28.9.2026): Sunce, Mesec i podznak U ZNAKU. Isto kao `besplatno()` u natal.py. */
export function isFreeNatalKey(key: string): boolean {
  return /^natal\.(sun|moon|ascendant)\.sign\.\w+$/.test(key);
}

export type NatalAspect = {
  key: string;
  a: { key: string; name: string; glyph: string };
  b: { key: string; name: string; glyph: string };
  aspect: { key: string; name: string; glyph: string };
  orb: number;
};

export type MoonSign =
  | { certain: true; sign: ZodiacSign }
  /** Bez vremena rodjenja: Mesec je tog dana presao iz jednog znaka u drugi. */
  | { certain: false; from: ZodiacSign; to: ZodiacSign };

/**
 * Znak Meseca kad vreme rodjenja nije poznato. `utc` je rodjenje racunato za
 * lokalno podne, pa je ceo lokalni dan otprilike ±12 sati oko njega.
 */
export function moonSignForUnknownTime(utc: Date): MoonSign {
  const H = 3_600_000;
  const od = signFromLongitude(bodyLongitude('moon', new Date(utc.getTime() - 12 * H))).sign;
  const doo = signFromLongitude(bodyLongitude('moon', new Date(utc.getTime() + 12 * H))).sign;
  return od.key === doo.key ? { certain: true, sign: od } : { certain: false, from: od, to: doo };
}

/** Aspekti planeta na Ascendent, natalnim orbisima iz `ASPECTS`. */
export function ascendantAspects(chart: NatalChart): NatalAspect[] {
  const asc = chart.houses.ascendant;
  const out: NatalAspect[] = [];
  for (const p of chart.planets) {
    let sep = Math.abs(p.longitude - asc) % 360;
    if (sep > 180) sep = 360 - sep;
    for (const a of ASPECTS) {
      const orb = Math.abs(sep - a.angle);
      if (orb > a.orb) continue;
      out.push({
        key: `natal.${p.key}.${a.key}.ascendant`,
        a: { key: p.key, name: p.name, glyph: p.glyph },
        b: { key: 'ascendant', name: 'Ascendent', glyph: 'ASC' },
        aspect: { key: a.key, name: a.name, glyph: a.glyph },
        orb,
      });
      break;
    }
  }
  return out;
}

function izAspekta(x: Aspect): NatalAspect {
  return {
    key: `natal.${x.contentKey}`,
    a: { key: x.a.key, name: x.a.name, glyph: x.a.glyph },
    b: { key: x.b.key, name: x.b.name, glyph: x.b.glyph },
    aspect: { key: x.aspect.key, name: x.aspect.name, glyph: x.aspect.glyph },
    orb: x.orb,
  };
}

/**
 * Svi aspekti koji se prikazuju u natalnoj karti, najtesnji prvi.
 * `interpreted` je false za aspekt koji postoji ali se NE tumaci (Mesec bez
 * vremena rodjenja) — red ostaje u tabeli, ali bez teksta.
 */
export function natalAspects(chart: NatalChart, timeUnknown: boolean): (NatalAspect & { interpreted: boolean })[] {
  const planete = findAspects(chart.planets).map(izAspekta);
  const naAsc = timeUnknown ? [] : ascendantAspects(chart);
  return [...planete, ...naAsc]
    .sort((x, y) => x.orb - y.orb)
    .map((x) => ({ ...x, interpreted: !(timeUnknown && (x.a.key === 'moon' || x.b.key === 'moon')) }));
}

/** Tema ekrana `/natal`: planeta, podznak ili aspekt. */
export type NatalTopic =
  | { kind: 'planet'; planet: string; signKey: string | null; houseKey: string | null; moon?: MoonSign }
  | { kind: 'ascendant'; signKey: string }
  | { kind: 'aspect'; aspect: NatalAspect };

/**
 * Sta ekran `/natal?tema=…` prikazuje — UVEK iz karte korisnika, ne iz
 * parametra. Parametar samo bira; tema koja nije u karti vraca null.
 */
export function natalTopic(
  chart: NatalChart,
  timeUnknown: boolean,
  utc: Date,
  tema: string
): NatalTopic | null {
  if (tema === 'ascendant') {
    return timeUnknown ? null : { kind: 'ascendant', signKey: `natal.ascendant.sign.${chart.ascendantSign.sign.key}` };
  }
  const p = chart.planets.find((x) => x.key === tema);
  if (p) {
    const houseKey = timeUnknown ? null : `natal.${p.key}.house.${p.house}`;
    if (p.key === 'moon' && timeUnknown) {
      const moon = moonSignForUnknownTime(utc);
      return { kind: 'planet', planet: p.key, signKey: moon.certain ? `natal.moon.sign.${moon.sign.key}` : null, houseKey, moon };
    }
    return { kind: 'planet', planet: p.key, signKey: `natal.${p.key}.sign.${p.position.sign.key}`, houseKey };
  }
  const a = natalAspects(chart, timeUnknown).find((x) => x.key === tema && x.interpreted);
  return a ? { kind: 'aspect', aspect: a } : null;
}

/** Svi kljucevi tumacenja koje ova karta ima — za proveru prema korpusu. */
export function allNatalKeys(chart: NatalChart, timeUnknown: boolean, utc: Date): string[] {
  const out: string[] = [];
  for (const p of chart.planets) {
    const t = natalTopic(chart, timeUnknown, utc, p.key);
    if (t?.kind === 'planet') {
      if (t.signKey) out.push(t.signKey);
      if (t.houseKey) out.push(t.houseKey);
    }
  }
  if (!timeUnknown) out.push(`natal.ascendant.sign.${chart.ascendantSign.sign.key}`);
  for (const a of natalAspects(chart, timeUnknown)) if (a.interpreted) out.push(a.key);
  return out;
}
