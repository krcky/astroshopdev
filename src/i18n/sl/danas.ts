import type { Recnik } from '../sr';
import { mnozina } from './gramatika';
import { nebo } from './nebo';

/** Prevod `sr/danas.ts` (slovenski). */

type Rod = 'm' | 'z' | 's';
const PADEZI = nebo.padeziTela as Record<string, { rod: Rod }>;

/** Rod tela po kljucu ("venus" -> z); Ascendent, MC in neznano so moskega spola. */
const rodKljuca = (kljuc: string): Rod => PADEZI[kljuc]?.rod ?? 'm';

/** Rod po imenu ("Luna" -> z) — `imeNatalni` dobi samo ime. */
const rodImena = (ime: string): Rod => {
  const kljuc = Object.entries(nebo.tela).find(([, v]) => v === ime)?.[0];
  return kljuc ? rodKljuca(kljuc) : 'm';
};

/** "natalni Mars", "natalna Luna", "natalno Sonce". */
const natalni = (rod: Rod) => ({ m: 'natalni', z: 'natalna', s: 'natalno' })[rod];

export const danas: Recnik['danas'] = {
  tabovi: {
    danas: 'Danes',
    tranziti: 'Tranziti',
    pitaj: 'Vprašaj',
    ti: 'Ti',
    nebo: 'Nebo',
  },

  pocetna: {
    tabTvojDan: 'Tvoj dan',
    tabMesec: 'Luna',
    tabPromene: 'Spremembe',
    tabTeme: 'Teme',
    danasUkratko: 'Danes na kratko',
    ukratko: 'Na kratko',
    ideTi: 'Gre ti',
    kociTe: 'Zavira te',
    nemaTranzitaDana: 'Za ta dan ni izrazitih tranzitov.',
    promeneNadnaslov: 'Kaj te čaka v prihodnjem obdobju',
    promeneNaslov: 'Spremembe na nebu',
    nemaPromena: 'Noben planet kmalu ne zamenja znamenja ali smeri.',
    temeNadnaslov: 'Tranziti, ki trajajo tedne in mesece',
    temeNaslov: 'Teme obdobja',
    nemaTema: 'Te dni noben počasen planet ni v aspektu s tvojo karto.',
    josUTranzitima: (n) => `Še ${n} v Tranzitih`,
    profil: 'Profil',
    dan: 'Dan',
    promeniDan: 'Zamenjaj dan',
    drugiDaniUzPremium: 'Drugi dnevi s Premiumom',
    izabranDan: (dan, opis) => `Izbran dan: ${dan}. ${opis}`,
    danUzPremium: (dan) => `${dan}. S Premiumom`,
    zatvoriMeni: 'Zapri meni',
    relativniDani: ['Predvčerajšnjim', 'Včeraj', 'Danes', 'Jutri', 'Pojutrišnjem'],
  },

  tranzit: {
    ime: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    imeNatalni: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalni(rodImena(natalna))} ${natalna}`,
    ascendent: 'Ascendent',
    mc: 'MC',
    samoDanas: 'Samo danes',
    uTvojojKuci: (kuca) => `V tvoji ${kuca}. hiši`,
    lunacijaVeci: (naslov, tema) => `${naslov}: ${tema}`,
    lunacijaManji: (faza, kuca) => `${faza} v tvoji ${kuca}. hiši`,
  },

  oblasti: {
    imena: {
      ljubav: 'Ljubezen',
      zdravlje: 'Zdravje in lepota',
      karijera: 'Kariera in finance',
      kuca: 'Dom in vrt',
    },
    oznakaOcene: { 5: 'Odličen dan', 4: 'Dober dan', 3: 'Miren dan', 2: 'Previdno', 1: 'Težak dan' },
    lunacijaMlad: 'Nov začetek',
    lunacijaPun: 'Vrhunec',
  },

  ocene: {
    otvorena: (oblast, ocena, oznaka) => `${oblast}, ocena ${ocena} od 5, ${oznaka}`,
    zakljucana: (oblast) => `${oblast}, s Premiumom`,
    otvaraPremium: 'Odpre Premium',
    otvaraTranzite: 'Odpre tranzite',
  },

  ton: {
    povoljno: 'Ugodno',
    izazovno: 'Zahtevno',
    mesovito: 'Mešano',
    oznaka: (ton) => `Ton: ${ton}`,
  },

  tranziti: {
    nemaNaKarti: 'Danes ni tranzitov na to karto.',
    nemaTvojih: 'Danes nimaš tranzitov.',
    josDanas: (n, tranzita) => `Še ${n} ${tranzita} danes`,
    zakljucaniOpis: 'Najmočnejši so odprti na vrhu seznama. Tudi ostali vplivajo na tvoj dan in vsak ima svojo celotno razlago.',
    otkljucajSve: 'Odkleni vse tranzite',
    otvaraCeoTekst: 'Odpre celotno razlago tranzita',
  },

  trajanje: {
    od: (dan) => `Od ${dan}`,
    duzeOdTriGodine: 'Traja več kot tri leta',
  },

  tvojDan: {
    oznaka: 'Tvoj dan',
    zastoOvajTekst: 'Zakaj ravno to besedilo?',
    saznajVise: 'Izvedi več',
    efekat: 'Pozitiven učinek',
    pazi: 'Izziv',
    savet: 'Nasvet',
  },

  tvojDanInfo: {
    naslov: 'Zakaj ravno to besedilo?',
    uvod: 'Besedilo je napisano za tranzit, ki je danes najpomembnejši v tvoji rojstni karti.',
    tranzitDana: 'Tranzit dneva',
    objasnjenje: (ugao) => `Planet z današnjega neba in kot ${ugao}°, ki ga oklepa s točko iz tvoje rojstne karte.`,
    tranzitVladara: 'Tranzit tvojega vladarja',
    nijeDeoKarte: 'Ta tranzit ni del tvoje karte.',
    vladarNatalni: (planeta, uZnaku) =>
      `${planeta} je vladar tvojega Ascendenta ${uZnaku}. Ko se ga dotakne tranzit, je dan bolj oseben in močnejši, zato ima ta tranzit danes prednost.`,
    vladarTranzitni: (planeta, uZnaku, koga) =>
      `${planeta} je vladar tvojega Ascendenta ${uZnaku}, danes pa spodbuja ${koga}. Zato ima ta tranzit danes prednost.`,
    /** Tozilnik s svojilnim zaimkom; planeti so nezivi, zato "tvoj Mars" (kot `nebo.padeziTela`). */
    tvojAkuzativ: {
      sun: 'tvoje Sonce', moon: 'tvojo Luno', mercury: 'tvoj Merkur', venus: 'tvojo Venero',
      mars: 'tvoj Mars', jupiter: 'tvoj Jupiter', saturn: 'tvoj Saturn', uranus: 'tvoj Uran',
      neptune: 'tvoj Neptun', pluto: 'tvoj Pluton', ascendant: 'tvoj Ascendent', midheaven: 'tvoj MC',
    },
  },

  tumacenje: {
    osobaViseNije: 'Te osebe ni več na tvojem seznamu.',
    tranzit: 'Tranzit',
    nijeNapisano: 'Razlaga za ta tranzit še ni napisana.',
    stizeKadVeza: 'Celotno besedilo se bo prikazalo, ko bo povezava spet vzpostavljena.',
    procitajDoKraja: 'Preberi do konca',
    viseOTranzitu: 'Več o tem tranzitu',
    pitajNaslov: 'Vprašaj astrologa o tem tranzitu',
    pitajOpis: (astrolog, oOsobi) =>
      `${astrolog} vidi ${oOsobi ? 'karto te osebe' : 'tvojo karto'} in odgovori z glasovnim sporočilom v srbščini, običajno v 2–3 delovnih dneh.`,
    postaviPitanje: 'Postavi vprašanje',
    kratkaVerzija: 'To je kratka različica. V celotni so področja življenja, na katera tranzit vpliva, dolgoročni učinki in konkretni nasveti.',
    otkljucajCeo: 'Odkleni celotno besedilo',
  },

  mesecDanas: {
    oznaka: 'Luna danes',
    osvetljen: (pct) => `${pct} % osvetljena`,
    naslov: (faza, uZnaku) => `${faza} ${uZnaku}`,
    slika: (naslov, pct, raste) =>
      `${naslov}, osvetljenost ${pct} ${mnozina(pct, ['odstotek', 'odstotka', 'odstotki', 'odstotkov'])}, ${raste ? 'narašča' : 'pojema'}`,
    saznajVise: 'Izvedi več',
    nemaSaveta: 'Nasveti za to področje še niso prispeli.',
    saveteKadVeza: 'Nasveti se bodo prikazali, ko bo povezava spet vzpostavljena.',
    zaTebe: 'Zate',
    tabovi: {
      ljubav: 'Ljubezen',
      zdravlje: 'Zdravje in lepota',
      karijera: 'Kariera in finance',
      kuca: 'Dom',
      basta: 'Vrt',
    },
  },

  promena: {
    /** "Mars vstopi v Leva". */
    ulazi: (planeta, uZnak) => `${planeta} vstopi ${uZnak}`,
    retrogradna: (kljuc, planeta, uZnaku) =>
      `${{ m: 'Retrogradni', z: 'Retrogradna', s: 'Retrogradno' }[rodKljuca(kljuc)]} ${planeta} ${uZnaku}`,
    direktna: (kljuc, planeta, uZnaku) =>
      `${planeta} spet ${{ m: 'direkten', z: 'direktna', s: 'direktno' }[rodKljuca(kljuc)]} ${uZnaku}`,
    traje: (doKad) => `Traja ${doKad}`,
  },

  horoskop: {
    nebo: (znak, faza, retrogradni) =>
      `Luna v znamenju ${znak} · ${faza}` + (retrogradni.length ? ` · retrogradni: ${retrogradni.join(', ')}` : ''),
  },

  ui: {
    ucitavam: 'Nalagam',
    poljeDan: 'dan',
    poljeMesec: 'mesec',
    poljeGodina: 'leto',
    poljeSat: 'ura',
    poljeMinut: 'minuta',
  },
};
