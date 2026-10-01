/**
 * Pitaj astrologa — cist racun i tekstovi oko pitanja (pravilo 6, bez RN uvoza).
 * Server: `supabase/pitanja.sql`. Upiti: `lib/pitanja-api.ts`. Provera:
 * `scripts/check-pitanja.ts`.
 *
 * ROKA NEMA (Ivan, 29.9.2026): "obicno za 2—3 radna dana" je okviran tekst,
 * bez racuna, statusa "kasni" i bez obecanja.
 */
import { tr } from '@/i18n/jezik';
import { sr } from '@/i18n/sr';
import { natalAspects } from '@/lib/natal-keys';
import { formatDay } from '@/lib/horoscope';
import { signFromLongitude, type SignPosition } from '@/lib/zodiac';
import type { OdnosKljuc } from '@/lib/osobe';
import type { SnimakKarte } from '@/lib/pitanja-snimak';
import type { ResolvedProfile } from '@/store/profile';

/** Najvise znakova u pitanju (Ivan, 29.9.2026: 500, ranije 1000). Isto ogranicenje drzi i baza. */
export const PITANJE_MAX = 500;

/**
 * Astrolog koji odgovara — jedno mesto za sve ekrane. Ime, padezi koje trazi recenica i
 * zvanje su u recniku (`t.pitaj.astrolog`; ime se ne prevodi), pa su getteri.
 * Okviran rok je u recenicama recnika (`i18n/sr/pitaj.ts`).
 */
export const ASTROLOG = {
  get ime() { return tr().pitaj.astrolog.ime; },
  get kratko() { return tr().pitaj.astrolog.kratko; },
  /** "Pitanje za Bobana" */
  get genitiv() { return tr().pitaj.astrolog.genitiv; },
  /** "stiže Bobanu" */
  get dativ() { return tr().pitaj.astrolog.dativ; },
  /** "Astrolog" — ispod imena u uvodu. */
  get zvanje() { return tr().pitaj.astrolog.zvanje; },
};

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
  /** Pitanje o drugoj osobi: njen id (NULL i kad je osoba posle obrisana). */
  osoba_id: string | null;
  /** Iz snimka (`karta->drugaOsoba`): pitanje je o drugoj osobi — ime onoga ko pita, inace null. */
  karta_pita: string | null;
  /** Iz snimka: ime osobe cija je karta. */
  karta_ime: string | null;
  /** Iz snimka: pitanje o odnosu — ime onoga ko pita iz njegove karte; inace null. */
  karta_par: string | null;
};

/**
 * O kome je pitanje, za listu "Moja pitanja": "Ana" ili "Ja i Ana"; null kad je
 * o vlasniku naloga. Ime se ne sklanja (ne znamo padeze unetog imena).
 */
export function oKome(p: Pick<Pitanje, 'karta_pita' | 'karta_ime' | 'karta_par'>): string | null {
  if (!p.karta_pita || !p.karta_ime) return null;
  return p.karta_par ? tr().pitaj.jaI(p.karta_ime) : p.karta_ime;
}

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
  const s = tr().pitaj.status;
  if (neprocitan(p)) return s.noviOdgovor;
  switch (p.status) {
    case 'draft': return s.nijePoslato;
    case 'paid': return s.cekaOdgovor;
    case 'answered': return s.odgovoreno;
    // Povracaj posle odgovora: odgovor ostaje, pa je i dalje "odgovoreno".
    case 'refunded': return p.audio_putanja ? s.odgovoreno : s.novacVracen;
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
  const g = tr().pitaj.greske;
  if (/prazno_pitanje/.test(m)) return g.prazno;
  if (/predugo_pitanje/.test(m)) return g.predugo(PITANJE_MAX);
  if (/nema_kredita/.test(m)) return g.nemaKredita;
  if (/nema_nacrta/.test(m)) return g.nemaNacrta;
  if (/nema_osobe/.test(m)) return g.nemaOsobe;
  if (/nema_naloga|JWT/i.test(m)) return g.nemaNaloga;
  if (/fetch|network|timed? ?out/i.test(m)) return g.mreza;
  return g.nepoznato;
}

/*
 * SNIMAK JE NA SRPSKOM, UVEK: ide u bazu (`pitanja.karta`) i u panel astrologa, koji
 * ostaje srpski. Imena se zato NE citaju iz tekuceg recnika (`p.name`, `sign.name`,
 * `formatted` prate jezik aplikacije) nego iz srpskog (`sr`), po kljucu. Na srpskom je
 * ishod isti znak po znak (`check:pitanja`, deo 5).
 */
const SNIMAK_UGLOVI: Record<string, string> = { ascendant: 'Ascendent' };
const imeTelaSr = (key: string, rezerva: string): string =>
  sr.nebo.tela[key as keyof typeof sr.nebo.tela] ?? SNIMAK_UGLOVI[key] ?? rezerva;
const imeZnakaSr = (p: SignPosition): string => sr.nebo.znaci[p.sign.key as keyof typeof sr.nebo.znaci]?.ime ?? p.sign.name;
/** "12° 34' Bik" — isti oblik kao `formatted` u `zodiac.ts`, sa srpskim imenom znaka. */
const stepenSr = (p: SignPosition): string => `${p.deg}° ${String(p.min).padStart(2, '0')}' ${imeZnakaSr(p)}`;
/** Odnos za astrologa, srpski naziv iz `profil.odnosi`; "Neko drugi" i neodabran se ne pisu (kao `nazivOdnosa`). */
const odnosSr = (k: OdnosKljuc | null): string | null => (!k || k === 'drugo' ? null : sr.profil.odnosi[k] ?? null);

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
  const polozaj = (p: SignPosition) => ({ znak: imeZnakaSr(p), stepen: stepenSr(p) });
  return {
    verzija: 1,
    ime: profile.name,
    rodjenje,
    zonaNepouzdana: false,
    vremeNepoznato: timeUnknown,
    sistemKuca: timeUnknown ? null : chart.houses.system,
    planete: chart.planets.map((p) => ({
      kljuc: p.key,
      ime: imeTelaSr(p.key, p.name),
      znak: imeZnakaSr(p.position),
      stepen: stepenSr(p.position),
      kuca: timeUnknown ? null : p.house,
      retro: p.retrograde,
    })),
    ascendent: timeUnknown ? null : polozaj(chart.ascendantSign),
    mc: timeUnknown ? null : polozaj(chart.midheavenSign),
    kuce: timeUnknown ? null : chart.houses.cusps.map((c) => polozaj(signFromLongitude(c))),
    // Isti spisak kao u tabu "Ti"; Mesecevi aspekti bez vremena rodjenja se ne salju.
    aspekti: natalAspects(chart, timeUnknown)
      .filter((a) => a.interpreted)
      .map((a) => ({
        a: imeTelaSr(a.a.key, a.a.name),
        aspekt: sr.nebo.aspekti[a.aspect.key as keyof typeof sr.nebo.aspekti] ?? a.aspect.name,
        b: imeTelaSr(a.b.key, a.b.name),
        orbis: `${a.orb.toFixed(1).replace('.', ',')}°`,
      })),
  };
}

/**
 * Snimak za pitanje o DRUGOJ osobi (v2): njena karta, ko je ona onome ko pita, i
 * — kad je pitanje o odnosu ("Ja i Ana") — i karta onoga ko pita. Astrolog tako
 * vidi o kome je pitanje i ko ga postavlja, a ne mesa ih.
 */
export function snimakODrugoj(
  osoba: ResolvedProfile,
  odnos: OdnosKljuc | null,
  ja: ResolvedProfile,
  oOdnosu: boolean,
): SnimakKarte {
  return {
    ...snimakKarte(osoba),
    verzija: 2,
    drugaOsoba: {
      odnos: odnosSr(odnos),
      pita: ja.profile.name,
      mojaKarta: oOdnosu ? snimakKarte(ja) : null,
    },
  };
}
