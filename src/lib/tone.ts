/**
 * Ton tranzita za karticu "Tvoj dan": Povoljno, Izazovno ili Mesovito.
 *
 * Redom: rucna oznaka astrologa (kolona `tone` u `transit_texts`) ima prednost;
 * bez nje se racuna po pravilu ispod. Uz ton ide i IZVOR (`manual` / `rule`),
 * da astrolog kasnije pregleda i prepise tonove izracunate po pravilu.
 *
 * Pravilo (Ivan, 27.9.2026) gleda OBE planete, tranzitnu i natalnu:
 *   trigon, sekstil                -> Povoljno
 *   konjunkcija: ima TESKU         -> Mesovito ako je druga BLAGA, inace Izazovno
 *                ima DINAMICNU     -> Mesovito
 *                inace             -> Povoljno
 *   kvadrat, opozicija: ima BLAGU a nema TESKU -> Mesovito, inace Izazovno
 *
 * Mesec ide po istom pravilu; njegova kratkotrajnost je u bodovanju, ne u tonu.
 */

export type Tone = 'povoljno' | 'izazovno' | 'mesovito';
export type ToneSource = 'manual' | 'rule';

export const TONE_LABEL: Record<Tone, string> = {
  povoljno: 'Povoljno',
  izazovno: 'Izazovno',
  mesovito: 'Mešovito',
};

type Nature = 'blaga' | 'neutralna' | 'dinamicna' | 'teska';

const NATURE: Record<string, Nature> = {
  venus: 'blaga', jupiter: 'blaga',
  sun: 'neutralna', moon: 'neutralna', mercury: 'neutralna', ascendant: 'neutralna', midheaven: 'neutralna',
  mars: 'dinamicna', uranus: 'dinamicna', neptune: 'dinamicna',
  saturn: 'teska', pluto: 'teska',
};

function nature(key: string): Nature {
  const n = NATURE[key];
  if (n) return n;
  // Kiron, cvor i sve buduce tacke: neutralno, ali glasno — da se pravilo dopuni.
  console.warn(`[ton] nepoznata tacka "${key}", tretira se kao neutralna`);
  return 'neutralna';
}

/** Ton po pravilu. `aspect` je kljuc iz `ASPECTS` (conjunction, square…). */
export function toneByRule(transitingKey: string, aspect: string, natalKey: string): Tone {
  const n = [nature(transitingKey), nature(natalKey)];
  const ima = (x: Nature) => n.includes(x);
  switch (aspect) {
    case 'trine':
    case 'sextile':
      return 'povoljno';
    case 'conjunction':
      if (ima('teska')) return ima('blaga') ? 'mesovito' : 'izazovno';
      return ima('dinamicna') ? 'mesovito' : 'povoljno';
    default: // square, opposition
      return ima('blaga') && !ima('teska') ? 'mesovito' : 'izazovno';
  }
}

/** Rucna oznaka iz baze -> ton. Prihvata "Povoljno", "mešovito", "mesovito"… */
export function parseTone(raw: string | null | undefined): Tone | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace('š', 's');
  return s === 'povoljno' || s === 'izazovno' || s === 'mesovito' ? s : null;
}

export function transitTone(
  transitingKey: string,
  aspect: string,
  natalKey: string,
  manual?: string | null
): { tone: Tone; source: ToneSource } {
  const m = parseTone(manual);
  if (m) return { tone: m, source: 'manual' };
  return { tone: toneByRule(transitingKey, aspect, natalKey), source: 'rule' };
}
