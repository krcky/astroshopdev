/**
 * Pitaj astrologa — cist racun i tekstovi oko pitanja (pravilo 6, bez RN uvoza).
 * Server: `supabase/pitanja.sql`. Upiti: `lib/pitanja-api.ts`. Provera:
 * `scripts/check-pitanja.ts`.
 *
 * ROKA NEMA (Ivan, 29.9.2026): "obicno za 2—3 radna dana" je okviran tekst,
 * bez racuna, statusa "kasni" i bez obecanja.
 */
import { natalAspects } from '@/lib/natal-keys';
import { formatDay } from '@/lib/horoscope';
import { signFromLongitude, type SignPosition } from '@/lib/zodiac';
import type { SnimakKarte } from '@/lib/pitanja-snimak';
import type { ResolvedProfile } from '@/store/profile';

/** Najvise znakova u pitanju (Ivan, 29.9.2026: 500, ranije 1000). Isto ogranicenje drzi i baza. */
export const PITANJE_MAX = 500;

/** Astrolog koji odgovara — jedno mesto za sve ekrane, sa padezima koje tekst trazi. */
export const ASTROLOG = {
  ime: 'Boban Vujović',
  kratko: 'Boban',
  /** "Pitanje za Bobana" */
  genitiv: 'Bobana',
  /** "stiže Bobanu" */
  dativ: 'Bobanu',
} as const;

/** Okviran rok — samo tekst (vidi gore). */
export const OKVIRNI_ROK = 'obično za 2–3 radna dana';

export type PitanjeStatus = 'draft' | 'paid' | 'answered' | 'refunded';

/** Red iz `pitanja`, onoliko koliko ga aplikacija cita. */
export type Pitanje = {
  id: string;
  tekst: string;
  status: PitanjeStatus;
  created_at: string;
  paid_at: string | null;
  answered_at: string | null;
  audio_putanja: string | null;
  audio_trajanje: number | null;
  /** Kad je odgovor prvi put otvoren; null uz snimak = nov odgovor. */
  procitano_at: string | null;
};

/** Pitanje moze da se posalje: posle obrezivanja ima 1—`PITANJE_MAX` znakova. */
export function pitanjeSpremno(tekst: string): boolean {
  const t = tekst.trim();
  return t.length > 0 && t.length <= PITANJE_MAX;
}

/** Odgovor stigao, a korisnik ga jos nije otvorio. */
export function neprocitan(p: Pick<Pitanje, 'audio_putanja' | 'procitano_at'>): boolean {
  return !!p.audio_putanja && !p.procitano_at;
}

/** Broj novih odgovora — oznaka na tabu "Pitaj". */
export function brojNeprocitanih(pitanja: readonly Pick<Pitanje, 'audio_putanja' | 'procitano_at'>[] | undefined): number {
  return (pitanja ?? []).filter(neprocitan).length;
}

/** Natpis stanja u listi "Moja pitanja". */
export function natpisStatusa(p: Pick<Pitanje, 'status' | 'audio_putanja' | 'procitano_at'>): string {
  if (neprocitan(p)) return 'Novi odgovor';
  switch (p.status) {
    case 'draft': return 'Nije poslato';
    case 'paid': return 'Čeka odgovor';
    case 'answered': return 'Odgovoreno';
    // Povracaj posle odgovora: odgovor ostaje, pa je i dalje "odgovoreno".
    case 'refunded': return p.audio_putanja ? 'Odgovoreno' : 'Novac je vraćen';
  }
}

/** Pitanje ima odgovor koji moze da se pusti. */
export function imaOdgovor(p: Pick<Pitanje, 'audio_putanja'>): boolean {
  return !!p.audio_putanja;
}

/**
 * Datum uz pitanje, "24. septembra": kad je stigao odgovor, a dok ga nema — kad je
 * pitanje poslato (nacrt: kad je napisan).
 */
export function datumPitanja(p: Pick<Pitanje, 'created_at' | 'paid_at' | 'answered_at'>, danas: Date = new Date()): string {
  return formatDay(new Date(p.answered_at ?? p.paid_at ?? p.created_at), danas);
}

/** Trajanje snimka: 95 -> "1:35". */
export function trajanjeZvuka(sekundi: number): string {
  const s = Math.max(0, Math.floor(sekundi));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Greska servera (`raise exception 'nema_kredita'`) ili mreze -> recenica za
 * korisnika. Sta se desilo, pa sta moze (copywriter-sr).
 */
export function porukaGreske(poruka: string | undefined | null): string {
  const m = poruka ?? '';
  if (/prazno_pitanje/.test(m)) return 'Pitanje je prazno. Napiši šta te zanima.';
  if (/predugo_pitanje/.test(m)) return `Pitanje je duže od ${PITANJE_MAX} znakova. Skrati ga pa pošalji.`;
  if (/nema_kredita/.test(m)) return 'Plaćeno pitanje je već iskorišćeno. Osveži stranu pa probaj ponovo.';
  if (/nema_nacrta/.test(m)) return 'Ovo pitanje je već poslato.';
  if (/nema_naloga|JWT/i.test(m)) return 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.';
  if (/fetch|network|timed? ?out/i.test(m)) return 'Nema veze sa serverom. Pitanje je sačuvano na telefonu — probaj kad se internet vrati.';
  return 'Pitanje nije sačuvano. Probaj ponovo za minut.';
}

/**
 * Snimak karte za astrologa, u trenutku slanja. Isti racun koji korisnik vidi u
 * tabu "Ti" — astrolog i korisnik gledaju istu kartu.
 *
 * RADIJE PRIZNATI NEGO POGADJATI (pravila 4 i 5): kad pomeraj zone nije pouzdan,
 * karta se ne salje (samo podaci o rodjenju); bez vremena rodjenja nema
 * ascendenta, kuca ni Mesecevih aspekata.
 */
export function snimakKarte(r: ResolvedProfile): SnimakKarte {
  const { profile, city, utc, chart, timeUnknown, zoneUnreliable } = r;
  const dvo = (n: number) => String(n).padStart(2, '0');
  const rodjenje = {
    datum: `${profile.birth.year}-${dvo(profile.birth.month)}-${dvo(profile.birth.day)}`,
    vreme: profile.time ? `${dvo(profile.time.hour)}:${dvo(profile.time.minute)}` : null,
    mesto: city.name,
    zemlja: city.country,
    sirina: city.latitude,
    duzina: city.longitude,
    zona: city.tz.name,
    utc: utc.toISOString(),
  };
  if (zoneUnreliable) {
    return {
      verzija: 1, ime: profile.name, rodjenje, zonaNepouzdana: true, vremeNepoznato: timeUnknown,
      sistemKuca: null, planete: [], ascendent: null, mc: null, kuce: null, aspekti: [],
    };
  }
  const polozaj = (p: SignPosition) => ({ znak: p.sign.name, stepen: p.formatted });
  return {
    verzija: 1,
    ime: profile.name,
    rodjenje,
    zonaNepouzdana: false,
    vremeNepoznato: timeUnknown,
    sistemKuca: timeUnknown ? null : chart.houses.system,
    planete: chart.planets.map((p) => ({
      kljuc: p.key,
      ime: p.name,
      znak: p.position.sign.name,
      stepen: p.position.formatted,
      kuca: timeUnknown ? null : p.house,
      retro: p.retrograde,
    })),
    ascendent: timeUnknown ? null : polozaj(chart.ascendantSign),
    mc: timeUnknown ? null : polozaj(chart.midheavenSign),
    kuce: timeUnknown ? null : chart.houses.cusps.map((c) => polozaj(signFromLongitude(c))),
    // Isti spisak kao u tabu "Ti"; Mesecevi aspekti bez vremena rodjenja se ne salju.
    aspekti: natalAspects(chart, timeUnknown)
      .filter((a) => a.interpreted)
      .map((a) => ({ a: a.a.name, aspekt: a.aspect.name, b: a.b.name, orbis: `${a.orb.toFixed(1).replace('.', ',')}°` })),
  };
}
