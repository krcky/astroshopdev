import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Prijevod `sr/danas.ts` (hrvatski). */

/** Rod planete za "retrogradna / retrogradni" — iz `nebo.padeziTela`. */
const zenska = (kljuc: string) => (nebo.padeziTela as Record<string, { rod: string }>)[kljuc]?.rod === 'z';

/** "natalni Jupiter", "natalna Venera", "natalno Sunce" — rod po imenu tijela (ime stize vec prevedeno). */
const natalni = (ime: string) => {
  const kljuc = Object.entries(nebo.tela).find(([, v]) => v === ime)?.[0];
  const rod = kljuc ? (nebo.padeziTela as Record<string, { rod: string }>)[kljuc]?.rod : 'm';
  return rod === 'z' ? 'natalna' : rod === 's' ? 'natalno' : 'natalni';
};

export const danas: Recnik['danas'] = {
  tabovi: {
    danas: 'Danas',
    tranziti: 'Tranziti',
    pitaj: 'Pitaj',
    ti: 'Ti',
    nebo: 'Nebo',
  },

  pocetna: {
    tabTvojDan: 'Tvoj dan',
    tabMesec: 'Mjesec',
    tabPromene: 'Promjene',
    tabTeme: 'Teme',
    danasUkratko: 'Danas ukratko',
    ukratko: 'Ukratko',
    ideTi: 'Ide ti',
    kociTe: 'Koči te',
    nemaTranzitaDana: 'Za ovaj dan nema izraženih tranzita.',
    promeneNadnaslov: 'Što te čeka u sljedećem razdoblju',
    promeneNaslov: 'Promjene na nebu',
    nemaPromena: 'Nijedan planet uskoro ne mijenja znak ni smjer.',
    temeNadnaslov: 'Tranziti koji traju tjednima i mjesecima',
    temeNaslov: 'Teme razdoblja',
    nemaTema: 'Ovih dana nijedan spori planet nije u aspektu s tvojom kartom.',
    josUTranzitima: (n) => `Još ${n} u Tranzitima`,
    profil: 'Profil',
    dan: 'Dan',
    promeniDan: 'Promijeni dan',
    drugiDaniUzPremium: 'Drugi dani uz Premium',
    izabranDan: (dan, opis) => `Odabran dan: ${dan}. ${opis}`,
    danUzPremium: (dan) => `${dan}. Uz Premium`,
    zatvoriMeni: 'Zatvori izbornik',
    relativniDani: ['Prekjučer', 'Jučer', 'Danas', 'Sutra', 'Prekosutra'],
  },

  tranzit: {
    ime: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    imeNatalni: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalni(natalna)} ${natalna}`,
    ascendent: 'Ascendent',
    mc: 'MC',
    samoDanas: 'Samo danas',
    uTvojojKuci: (kuca) => `U tvojoj ${kuca}. kući`,
    lunacijaVeci: (naslov, tema) => `${naslov}: ${tema}`,
    lunacijaManji: (faza, kuca) => `${faza} u tvojoj ${kuca}. kući`,
  },

  oblasti: {
    imena: {
      ljubav: 'Ljubav',
      zdravlje: 'Zdravlje i ljepota',
      karijera: 'Karijera i financije',
      kuca: 'Kuća i vrt',
    },
    oznakaOcene: { 5: 'Odličan dan', 4: 'Dobar dan', 3: 'Miran dan', 2: 'Oprezno', 1: 'Težak dan' },
    lunacijaMlad: 'Novi početak',
    lunacijaPun: 'Vrhunac',
  },

  ocene: {
    otvorena: (oblast, ocena, oznaka) => `${oblast}, ocjena ${ocena} od 5, ${oznaka}`,
    zakljucana: (oblast) => `${oblast}, uz Premium`,
    otvaraPremium: 'Otvara Premium',
    otvaraTranzite: 'Otvara tranzite',
  },

  ton: {
    povoljno: 'Povoljno',
    izazovno: 'Izazovno',
    mesovito: 'Mješovito',
    oznaka: (ton) => `Ton: ${ton}`,
  },

  tranziti: {
    nemaNaKarti: 'Danas nema tranzita na ovu kartu.',
    nemaTvojih: 'Danas nema tvojih tranzita.',
    josDanas: (n, teksta) => `Još ${n} ${teksta} danas`,
    zakljucaniOpis: 'Najjači su otvoreni. I ostali utječu na tvoj dan, a svaki ima svoje tumačenje.',
    otkljucajSve: 'Otključaj sve',
    otvaraCeoTekst: 'Otvara cijeli tekst tranzita',
  },

  trajanje: {
    od: (dan) => `Od ${dan}`,
    duzeOdTriGodine: 'Traje dulje od tri godine',
  },

  tvojDan: {
    oznaka: 'Tvoj dan',
    zastoOvajTekst: 'Zašto baš ovaj tekst?',
    saznajVise: 'Saznaj više',
    efekat: 'Pozitivan učinak',
    pazi: 'Izazov',
    savet: 'Savjet',
  },

  tvojDanInfo: {
    naslov: 'Zašto baš ovaj tekst?',
    uvod: 'Tekst je napisan za tranzit koji je danas najvažniji u tvojoj natalnoj karti.',
    tranzitDana: 'Tranzit dana',
    objasnjenje: (ugao) => `Planet s današnjeg neba i kut od ${ugao}° koji zatvara s točkom iz tvoje natalne karte.`,
    tranzitVladara: 'Tranzit tvog vladara',
    nijeDeoKarte: 'Ovaj tranzit nije dio tvoje karte.',
    vladarNatalni: (planeta, uZnaku) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}. Kad ga tranzit dotakne, dan je osobniji i jači, zato ovaj tranzit danas ima prednost.`,
    vladarTranzitni: (planeta, uZnaku, koga) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}, a danas pokreće ${koga}. Zato ovaj tranzit danas ima prednost.`,
    tvojAkuzativ: {
      sun: 'tvoje Sunce', moon: 'tvoj Mjesec', mercury: 'tvoj Merkur', venus: 'tvoju Veneru',
      mars: 'tvog Marsa', jupiter: 'tvog Jupitera', saturn: 'tvog Saturna', uranus: 'tvog Urana',
      neptune: 'tvog Neptuna', pluto: 'tvog Plutona', ascendant: 'tvoj Ascendent', midheaven: 'tvoj MC',
    },
  },

  tumacenje: {
    osobaViseNije: 'Ova osoba više nije na tvom popisu.',
    tranzit: 'Tranzit',
    nijeNapisano: 'Tumačenje za ovaj tranzit još nije napisano.',
    stizeKadVeza: 'Cijeli tekst pojavit će se kad se veza vrati.',
    procitajDoKraja: 'Pročitaj do kraja',
    viseOTranzitu: 'Više o ovom tranzitu',
    pitajNaslov: 'Pitaj astrologa o ovom tranzitu',
    pitajOpis: (astrolog, oOsobi) =>
      `${astrolog} vidi ${oOsobi ? 'kartu ove osobe' : 'tvoju kartu'} i odgovara glasovnom porukom, obično za 2–3 radna dana.`,
    postaviPitanje: 'Postavi pitanje',
    kratkaVerzija: 'Ovo je kratka verzija. U cijeloj piše što se događa, koliko traje i što možeš učiniti.',
    otkljucajCeo: 'Otključaj cijeli tekst',
  },

  mesecDanas: {
    oznaka: 'Mjesec danas',
    osvetljen: (pct) => `${pct}% osvijetljen`,
    naslov: (faza, uZnaku) => `${faza} ${uZnaku}`,
    slika: (naslov, pct, raste) => `${naslov}, osvijetljenost ${pct} posto, ${raste ? 'raste' : 'opada'}`,
    saznajVise: 'Saznaj više',
    nemaSaveta: 'Savjeti za ovo područje još nisu stigli.',
    saveteKadVeza: 'Savjeti će se pojaviti kad se veza vrati.',
    zaTebe: 'Za tebe',
    tabovi: {
      ljubav: 'Ljubav',
      zdravlje: 'Zdravlje i ljepota',
      karijera: 'Karijera i financije',
      kuca: 'Kuća',
      basta: 'Vrt',
    },
  },

  promena: {
    ulazi: (planeta, uZnak) => `${planeta} ulazi ${uZnak}`,
    retrogradna: (kljuc, planeta, uZnaku) =>
      `${zenska(kljuc) ? 'Retrogradna' : 'Retrogradni'} ${planeta} ${uZnaku}`,
    direktna: (kljuc, planeta, uZnaku) =>
      `${planeta} ponovno ${zenska(kljuc) ? 'direktna' : 'direktan'} ${uZnaku}`,
    traje: (doKad) => `Traje ${doKad}`,
  },

  horoskop: {
    nebo: (znak, faza, retrogradni) =>
      `Mjesec u znaku ${znak} · ${faza}` + (retrogradni.length ? ` · retrogradni: ${retrogradni.join(', ')}` : ''),
  },

  ui: {
    ucitavam: 'Učitavam',
    poljeDan: 'dan',
    poljeMesec: 'mjesec',
    poljeGodina: 'godina',
    poljeSat: 'sat',
    poljeMinut: 'minuta',
  },
};
