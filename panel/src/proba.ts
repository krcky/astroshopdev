/**
 * Probni rezim panela (`#/proba`) — SAMO U RAZVOJU (`app.tsx` ga ucitava iza
 * `import.meta.env.DEV`, pa ga produkcijski build ne sadrzi).
 *
 * Pitanja su izmisljena; karte su IZRACUNATE istim kodom kao u aplikaciji
 * (`snimakKarte`, Beograd 10.7.1990. 14:30 i Novi Sad 2.3.1985. bez vremena); jedno
 * pitanje je o drugoj osobi i odnosu (snimak v2, `snimakODrugoj`).
 * Slanje odgovora ne ide nigde — pitanje se samo oznaci kao odgovoreno u memoriji.
 */
import type { SnimakKarte } from '../../src/lib/pitanja-snimak';
import type { Izvor } from './podaci';
import type { PitanjePanel } from './supabase';

const ANA = {"verzija": 1, "ime": "Ana", "rodjenje": {"datum": "1990-07-10", "vreme": "14:30", "mesto": "Beograd", "zemlja": "Srbija", "sirina": 44.804, "duzina": 20.4651, "zona": "Europe/Belgrade", "utc": "1990-07-10T12:30:00.000Z"}, "zonaNepouzdana": false, "vremeNepoznato": false, "sistemKuca": "placidus", "planete": [{"kljuc": "moon", "ime": "Mesec", "znak": "Vodolija", "stepen": "16° 33' Vodolija", "kuca": 4, "retro": false}, {"kljuc": "sun", "ime": "Sunce", "znak": "Rak", "stepen": "17° 59' Rak", "kuca": 9, "retro": false}, {"kljuc": "mercury", "ime": "Merkur", "znak": "Rak", "stepen": "27° 03' Rak", "kuca": 9, "retro": false}, {"kljuc": "venus", "ime": "Venera", "znak": "Blizanci", "stepen": "18° 26' Blizanci", "kuca": 8, "retro": false}, {"kljuc": "mars", "ime": "Mars", "znak": "Ovan", "stepen": "28° 34' Ovan", "kuca": 6, "retro": false}, {"kljuc": "jupiter", "ime": "Jupiter", "znak": "Rak", "stepen": "21° 25' Rak", "kuca": 9, "retro": false}, {"kljuc": "saturn", "ime": "Saturn", "znak": "Jarac", "stepen": "22° 19' Jarac", "kuca": 3, "retro": true}, {"kljuc": "uranus", "ime": "Uran", "znak": "Jarac", "stepen": "7° 09' Jarac", "kuca": 3, "retro": true}, {"kljuc": "neptune", "ime": "Neptun", "znak": "Jarac", "stepen": "13° 03' Jarac", "kuca": 3, "retro": true}, {"kljuc": "pluto", "ime": "Pluton", "znak": "Škorpija", "stepen": "15° 02' Škorpija", "kuca": 1, "retro": true}], "ascendent": {"znak": "Škorpija", "stepen": "4° 58' Škorpija"}, "mc": {"znak": "Lav", "stepen": "13° 40' Lav"}, "kuce": [{"znak": "Škorpija", "stepen": "4° 58' Škorpija"}, {"znak": "Strelac", "stepen": "3° 21' Strelac"}, {"znak": "Jarac", "stepen": "7° 05' Jarac"}, {"znak": "Vodolija", "stepen": "13° 40' Vodolija"}, {"znak": "Ribe", "stepen": "16° 48' Ribe"}, {"znak": "Ovan", "stepen": "13° 38' Ovan"}, {"znak": "Bik", "stepen": "4° 58' Bik"}, {"znak": "Blizanci", "stepen": "3° 21' Blizanci"}, {"znak": "Rak", "stepen": "7° 05' Rak"}, {"znak": "Lav", "stepen": "13° 40' Lav"}, {"znak": "Devica", "stepen": "16° 48' Devica"}, {"znak": "Vaga", "stepen": "13° 38' Vaga"}], "aspekti": [{"a": "Jupiter", "aspekt": "opozicija", "b": "Saturn", "orbis": "0,9°"}, {"a": "Mesec", "aspekt": "kvadrat", "b": "Pluton", "orbis": "1,5°"}, {"a": "Merkur", "aspekt": "kvadrat", "b": "Mars", "orbis": "1,5°"}, {"a": "Mesec", "aspekt": "trigon", "b": "Venera", "orbis": "1,9°"}, {"a": "Neptun", "aspekt": "sekstil", "b": "Pluton", "orbis": "2,0°"}, {"a": "Uran", "aspekt": "sekstil", "b": "Ascendent", "orbis": "2,2°"}, {"a": "Sunce", "aspekt": "trigon", "b": "Pluton", "orbis": "3,0°"}, {"a": "Sunce", "aspekt": "konjunkcija", "b": "Jupiter", "orbis": "3,4°"}, {"a": "Sunce", "aspekt": "opozicija", "b": "Saturn", "orbis": "4,3°"}, {"a": "Merkur", "aspekt": "opozicija", "b": "Saturn", "orbis": "4,7°"}, {"a": "Sunce", "aspekt": "opozicija", "b": "Neptun", "orbis": "4,9°"}, {"a": "Merkur", "aspekt": "konjunkcija", "b": "Jupiter", "orbis": "5,6°"}, {"a": "Uran", "aspekt": "konjunkcija", "b": "Neptun", "orbis": "5,9°"}, {"a": "Mars", "aspekt": "opozicija", "b": "Ascendent", "orbis": "6,4°"}]} as SnimakKarte;
const MARKO = {"verzija": 1, "ime": "Marko", "rodjenje": {"datum": "1985-03-02", "vreme": null, "mesto": "Novi Sad", "zemlja": "Srbija", "sirina": 45.2517, "duzina": 19.8369, "zona": "Europe/Belgrade", "utc": "1985-03-02T11:00:00.000Z"}, "zonaNepouzdana": false, "vremeNepoznato": true, "sistemKuca": null, "planete": [{"kljuc": "moon", "ime": "Mesec", "znak": "Rak", "stepen": "10° 36' Rak", "kuca": null, "retro": false}, {"kljuc": "sun", "ime": "Sunce", "znak": "Ribe", "stepen": "11° 48' Ribe", "kuca": null, "retro": false}, {"kljuc": "mercury", "ime": "Merkur", "znak": "Ribe", "stepen": "21° 33' Ribe", "kuca": null, "retro": false}, {"kljuc": "venus", "ime": "Venera", "znak": "Ovan", "stepen": "19° 54' Ovan", "kuca": null, "retro": false}, {"kljuc": "mars", "ime": "Mars", "znak": "Ovan", "stepen": "20° 40' Ovan", "kuca": null, "retro": false}, {"kljuc": "jupiter", "ime": "Jupiter", "znak": "Vodolija", "stepen": "5° 16' Vodolija", "kuca": null, "retro": false}, {"kljuc": "saturn", "ime": "Saturn", "znak": "Škorpija", "stepen": "28° 06' Škorpija", "kuca": null, "retro": false}, {"kljuc": "uranus", "ime": "Uran", "znak": "Strelac", "stepen": "17° 47' Strelac", "kuca": null, "retro": false}, {"kljuc": "neptune", "ime": "Neptun", "znak": "Jarac", "stepen": "3° 18' Jarac", "kuca": null, "retro": false}, {"kljuc": "pluto", "ime": "Pluton", "znak": "Škorpija", "stepen": "4° 34' Škorpija", "kuca": null, "retro": true}], "ascendent": null, "mc": null, "kuce": null, "aspekti": [{"a": "Jupiter", "aspekt": "kvadrat", "b": "Pluton", "orbis": "0,7°"}, {"a": "Venera", "aspekt": "konjunkcija", "b": "Mars", "orbis": "0,8°"}, {"a": "Neptun", "aspekt": "sekstil", "b": "Pluton", "orbis": "1,3°"}, {"a": "Venera", "aspekt": "trigon", "b": "Uran", "orbis": "2,1°"}, {"a": "Mars", "aspekt": "trigon", "b": "Uran", "orbis": "2,9°"}, {"a": "Merkur", "aspekt": "kvadrat", "b": "Uran", "orbis": "3,8°"}, {"a": "Sunce", "aspekt": "kvadrat", "b": "Uran", "orbis": "6,0°"}]} as SnimakKarte;

/** Pitanje o DRUGOJ osobi (snimak v2): Ana pita o partneru Marku i njihovom odnosu. */
const MARKO_O_ODNOSU: SnimakKarte = { ...MARKO, verzija: 2, drugaOsoba: { odnos: 'Partner', pita: 'Ana', mojaKarta: ANA } };

const sat = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const A = '00000000-0000-4000-8000-00000000000a';
const M = '00000000-0000-4000-8000-00000000000b';

const pitanja: PitanjePanel[] = [
  { id: '10000000-0000-4000-8000-000000000001', user_id: A, status: 'paid', karta: ANA, sandbox: false,
    tekst: 'Razmišljam da promenim posao ove jeseni. Dobila sam ponudu iz druge firme, ali mi je trenutni tim drag i plašim se da pogrešim. Šta moja karta kaže o tom periodu i na šta da obratim pažnju?',
    created_at: sat(52), paid_at: sat(51), answered_at: null, audio_putanja: null, audio_trajanje: null },
  { id: '10000000-0000-4000-8000-000000000002', user_id: M, status: 'paid', karta: MARKO, sandbox: true,
    tekst: 'Da li je sledeća godina dobra za selidbu u inostranstvo?',
    created_at: sat(3), paid_at: sat(3), answered_at: null, audio_putanja: null, audio_trajanje: null },
  { id: '10000000-0000-4000-8000-000000000004', user_id: A, status: 'paid', karta: MARKO_O_ODNOSU, sandbox: false,
    tekst: 'Kako da se Marko i ja bolje razumemo kad se posvađamo? Čini mi se da uvek pričamo o različitim stvarima.',
    created_at: sat(20), paid_at: sat(20), answered_at: null, audio_putanja: null, audio_trajanje: null },
  { id: '10000000-0000-4000-8000-000000000003', user_id: A, status: 'answered', karta: ANA, sandbox: false,
    tekst: 'Kako da razumem to što mi se u vezama stalno ponavlja isti obrazac?',
    created_at: sat(400), paid_at: sat(400), answered_at: sat(350), audio_putanja: `${A}/10000000-0000-4000-8000-000000000003.m4a`, audio_trajanje: 312 },
];

export const probniIzvor: Izvor = {
  async lista(tab) {
    return tab === 'ceka'
      ? pitanja.filter((p) => p.status === 'paid').sort((a, b) => (a.paid_at! < b.paid_at! ? -1 : 1))
      : pitanja.filter((p) => p.audio_putanja);
  },
  async pitanje(id) { return pitanja.find((p) => p.id === id) ?? null; },
  async ranija(p) { return pitanja.filter((x) => x.user_id === p.user_id && x.id !== p.id); },
  async linkZvuka() { return null; },
  async posaljiOdgovor(p, s) {
    await new Promise((r) => setTimeout(r, 600));
    Object.assign(p, { status: 'answered', answered_at: new Date().toISOString(), audio_putanja: `${p.user_id}/${p.id}.${s.ext}`, audio_trajanje: s.sekundi });
  },
};
