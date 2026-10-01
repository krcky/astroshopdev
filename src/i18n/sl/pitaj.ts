import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * Prevod `sr/pitaj.ts` (slovenski) — Pitaj astrologa (CLAUDE.md, pravilo 21).
 *
 * Astrolog odgovara GLASOM, NA SRPSKOM. Nikad ne obecavati odgovor na slovenackom: uvod
 * (`uvod.glasovno`) i tekst cekanja (`pitanje.ceka`) to kazu ("v srbščini").
 */

/** Okviran rok — samo tekst, bez racuna i obecanja (ROKA NEMA, pravilo 21). */
const ROK = 'običajno v 2–3 delovnih dneh';
const ROK_KRATKO = '2–3 delovnih dneh';

export const pitaj: Recnik['pitaj'] = {
  /** Ime ostaje; padezi: rodilnik/tozilnik "Bobana" ("za Bobana"), dajalnik "Bobanu". */
  astrolog: {
    ime: 'Boban Vujović',
    kratko: 'Boban',
    zvanje: 'Astrolog',
    genitiv: 'Bobana',
    dativ: 'Bobanu',
  },

  status: {
    noviOdgovor: 'Nov odgovor',
    nijePoslato: 'Ni poslano',
    cekaOdgovor: 'Čaka na odgovor',
    odgovoreno: 'Odgovorjeno',
    novacVracen: 'Denar je vrnjen',
  },

  jaI: (ime) => `Jaz in ${ime}`,

  greske: {
    prazno: 'Vprašanje je prazno. Napiši, kaj te zanima.',
    predugo: (max) => `Vprašanje je daljše od ${max} znakov. Skrajšaj ga in ga pošlji.`,
    nemaKredita: 'Plačano vprašanje je že porabljeno, na primer na drugem telefonu. To vprašanje lahko plačaš.',
    nemaNacrta: 'To vprašanje je že poslano.',
    nemaOsobe: 'Te osebe ni več na tvojem seznamu. Izberi, o kom je vprašanje, in ga pošlji.',
    nemaNaloga: 'Prijava je potekla. Zapri aplikacijo in jo znova odpri.',
    mreza: 'Ni povezave s strežnikom. Vprašanje je shranjeno na telefonu — poskusi znova, ko bo internet spet na voljo.',
    nepoznato: 'Vprašanje ni shranjeno. Poskusi znova čez minuto.',
  },

  tab: {
    naslov: 'Vprašaj astrologa',
    covek: 'Vprašaj človeka',
    ai: 'Vprašaj AI',
    uskoro: 'kmalu',
    /** Vprasanje (srednji rod): 1 vprasanje, 2 vprasanji, 3 vprasanja, 5 vprasanj. */
    krediti: (n) => (n === 1
      ? 'Imaš eno plačano vprašanje.'
      : `Imaš ${n} ${mnozina(n, ['plačano vprašanje', 'plačani vprašanji', 'plačana vprašanja', 'plačanih vprašanj'])}.`),
    pitaj: 'Vprašaj',
    /** Iznad "Postavi pitanje" kad vec ima pitanja (Ivan, 1.10.2026). */
    josJedno: (ime: string) => `Imaš novo vprašanje? ${ime} pogleda tvojo natalno karto in ti odgovori z glasovnim sporočilom.`,
    postavi: 'Postavi vprašanje',
    mojaPitanja: 'Moja vprašanja',
    zavrsi: 'Dokončaj',
    redOpis: (oKome, status, datum) =>
      `${oKome ? `${oKome} · ` : ''}${status} · ${datum}`,
    aiOpis: 'Za krajša vprašanja takojšen odgovor — sestavljen iz besedil astrologa, ki jih že bereš v aplikaciji. Delamo na tem.',
  },

  uvod: {
    naslov: 'Odgovarja pravi astrolog, ne AI',
    opis: (ime) => `Napiši, kaj te zanima, ${ime} pa si bo ogledal tvojo rojstno karto in ti osebno odgovoril.`,
    /** Mora reci da je odgovor na srpskom. */
    glasovno: `Odgovor dobiš kot glasovno sporočilo, v srbščini, v ${ROK_KRATKO}.`,
    nijeSavet: 'Astrološka razlaga ni zdravniški, pravni ali finančni nasvet.',
    placanje: 'Enkratno plačilo za vsako vprašanje',
  },

  novo: {
    posleKupovine: {
      odustao: 'Vprašanje je shranjeno. Pošlješ ga lahko pozneje.',
      ceka: (dativ) => `Plačilo čaka na odobritev. Vprašanje bo poslano ${dativ}, takoj ko bo potrjeno.`,
      greska: 'Plačilo ni bilo dokončano. Vprašanje je shranjeno — poskusi znova.',
      nedostupno: 'Plačilo v aplikaciji še ni vklopljeno. Vprašanje je shranjeno in čaka tukaj.',
    },
    poslatoNaslov: 'Vprašanje je poslano.',
    poslatoOpis: (ime) => `${ime} odgovori ${ROK}. Odgovor se bo prikazal v „Mojih vprašanjih“.`,
    napisi: 'Napiši vprašanje',
    bezInterneta: 'Za pošiljanje vprašanja potrebuješ internet.',
    vecPlaceno: 'To vprašanje je že plačano. Po pošiljanju ga ni mogoče spremeniti.',
    placanje: (cena) =>
      `${cena ? `${cena} · enkratno plačilo. ` : ''}Po plačilu vprašanja ni mogoče spremeniti.`,
    naslov: (genitiv) => `Vprašanje za ${genitiv}`,
    vidiTvoju: (ime) => `${ime} vidi tvojo karto, zato ti ni treba pisati datuma in kraja rojstva.`,
    vidiObe: (ime) => `${ime} vidi obe karti, zato ti ni treba pisati rojstnih podatkov.`,
    vidiOsobe: (ime) => `${ime} vidi karto osebe, o kateri sprašuješ, zato ti ni treba pisati njenih podatkov.`,
    oKome: 'O kom je vprašanje',
    ja: 'Jaz',
    oNamaDvoma: 'Vprašanje je o naju dveh — pošlji tudi mojo karto',
    primerJa: 'Npr. To jesen razmišljam o menjavi službe. Kaj o tem obdobju pravi moja karta?',
    primerOdnos: 'Npr. Kako se lahko bolje razumeva, ko se ne strinjava?',
    primerOsoba: 'Npr. Čemu naj to jesen posvetim pozornost? Kaj pravi karta te osebe?',
    poljeOpis: 'Tvoje vprašanje',
    brojac: (n, max) => `${n} / ${max}`,
    posalji: 'Pošlji vprašanje',
    naPlacanje: 'Nadaljuj na plačilo',
  },

  pitanje: {
    nijeUcitano: 'Vprašanje se ni naložilo. Preveri internet in ga znova odpri.',
    nePostoji: 'To vprašanje ne obstaja več.',
    oznaka: (status, datum) => `${status} · ${datum}`,
    tvojePitanje: 'Tvoje vprašanje',
    odgovor: 'Odgovor',
    glasovnaPoruka: 'Glasovno sporočilo',
    /** Mora reci da je odgovor na srpskom. */
    ceka: (ime) => `${ime} odgovori ${ROK}. Odgovor se bo prikazal tukaj, kot glasovno sporočilo, v srbščini.`,
    nijePoslato: 'Vprašanje še ni poslano.',
    vraceno: (ime) => `Denar za to vprašanje je vrnjen, zato ga ${ime} ne bo prejel.`,
  },

  plejer: {
    pauziraj: 'Začasno ustavi odgovor',
    pusti: 'Predvajaj odgovor',
    napredak: 'Potek odgovora',
    /** Bralnik zaslona: "0:35 od 1:20". */
    vremeOd: (sada, ukupno) => `${sada} od ${ukupno}`,
    brzinaNormalna: 'Običajna hitrost',
    brzinaPoIPo: 'Hitrost ena in pol',
    brzina1: '1x',
    brzina15: '1,5x',
    nijeStigao: 'Posnetek ni prispel. Preveri internet in znova odpri vprašanje.',
    neMozeDaSePusti: 'Posnetka ni mogoče predvajati. Zapri vprašanje in ga znova odpri.',
  },
};
