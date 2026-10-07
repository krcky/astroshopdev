import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Prijevod `sr/danas.ts` (bosanski). */

/** Rod planete za "retrogradna / retrogradni" — iz `nebo.padeziTela`. */
const zenska = (kljuc: string) => (nebo.padeziTela as Record<string, { rod: string }>)[kljuc]?.rod === 'z';

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
    promeneNadnaslov: 'Šta te čeka u narednom periodu',
    promeneNaslov: 'Promjene na nebu',
    nemaPromena: 'Nijedna planeta uskoro ne mijenja znak ni smjer.',
    temeNadnaslov: 'Tranziti koji traju sedmicama i mjesecima',
    temeNaslov: 'Teme perioda',
    nemaTema: 'Ovih dana nijedna spora planeta nije u aspektu sa tvojom kartom.',
    josUTranzitima: (n) => `Još ${n} u Tranzitima`,
    profil: 'Profil',
    dan: 'Dan',
    promeniDan: 'Promijeni dan',
    drugiDaniUzPremium: 'Drugi dani uz Premium',
    izabranDan: (dan, opis) => `Izabran dan: ${dan}. ${opis}`,
    danUzPremium: (dan) => `${dan}. Uz Premium`,
    zatvoriMeni: 'Zatvori meni',
    relativniDani: ['Prekjučer', 'Jučer', 'Danas', 'Sutra', 'Prekosutra'],
  },

  tranzit: {
    ime: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    /** Pridjev se slaže sa rodom natalne tačke: "natalna Venera", "natalno Sunce", "natalni Mars". */
    imeNatalni: (tranzitna, aspekt, natalna) =>
      `${tranzitna} ${aspekt} ${natalna === nebo.tela.venus ? 'natalna' : natalna === nebo.tela.sun ? 'natalno' : 'natalni'} ${natalna}`,
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
      karijera: 'Karijera i finansije',
      kuca: 'Kuća i bašta',
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
    /** Naslovi dve grupe na tabu "Tranziti": brze planete (Sunce—Mars) i spore (Jupiter—Pluton). */
    kratkotrajni: 'Kratkotrajni',
    dugotrajni: 'Dugotrajni',
    zakljucaniOpis: 'Najjači su otvoreni. I ostali utiču na tvoj dan i svaki ima svoje tumačenje.',
    otkljucajSve: 'Otključaj sve',
    otvaraCeoTekst: 'Otvara cijeli tekst tranzita',
  },

  trajanje: {
    od: (dan) => `Od ${dan}`,
    duzeOdTriGodine: 'Traje duže od tri godine',
  },

  tvojDan: {
    oznaka: 'Tvoj dan',
    zastoOvajTekst: 'Zašto baš ovaj tekst?',
    saznajVise: 'Saznaj više',
    efekat: 'Pozitivan efekat',
    pazi: 'Izazov',
    savet: 'Savjet',
  },

  tvojDanInfo: {
    naslov: 'Zašto baš ovaj tekst?',
    uvod: 'Tekst je napisan za tranzit koji je danas najvažniji u tvojoj natalnoj karti.',
    tranzitDana: 'Tranzit dana',
    objasnjenje: (ugao) => `Planeta sa današnjeg neba i ugao od ${ugao}° koji zaklapa sa tačkom iz tvoje natalne karte.`,
    tranzitVladara: 'Tranzit tvog vladara',
    nijeDeoKarte: 'Ovaj tranzit nije dio tvoje karte.',
    vladarNatalni: (planeta, uZnaku) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}. Kad ga tranzit dodirne, dan se osjeća ličnije i jače, zato ovaj tranzit danas ima prednost.`,
    vladarTranzitni: (planeta, uZnaku, koga) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}, a danas pokreće ${koga}. Zato ovaj tranzit danas ima prednost.`,
    tvojAkuzativ: {
      sun: 'tvoje Sunce', moon: 'tvoj Mjesec', mercury: 'tvoj Merkur', venus: 'tvoju Veneru',
      mars: 'tvog Marsa', jupiter: 'tvog Jupitera', saturn: 'tvog Saturna', uranus: 'tvog Urana',
      neptune: 'tvog Neptuna', pluto: 'tvog Plutona', ascendant: 'tvoj Ascendent', midheaven: 'tvoj MC',
    },
  },

  tumacenje: {
    osobaViseNije: 'Ova osoba više nije na tvojoj listi.',
    tranzit: 'Tranzit',
    nijeNapisano: 'Tumačenje za ovaj tranzit još nije napisano.',
    stizeKadVeza: 'Cijeli tekst će se pojaviti kad se veza vrati.',
    procitajDoKraja: 'Pročitaj do kraja',
    viseOTranzitu: 'Više o ovom tranzitu',
    pitajNaslov: 'Pitaj astrologa o ovom tranzitu',
    pitajOpis: (astrolog, oOsobi) =>
      `${astrolog} vidi ${oOsobi ? 'kartu ove osobe' : 'tvoju kartu'} i odgovara glasovnom porukom, obično za 2–3 radna dana.`,
    postaviPitanje: 'Postavi pitanje',
    kratkaVerzija: 'Ovo je kratka verzija. U cijeloj piše šta se dešava, koliko traje i šta možeš uraditi.',
    otkljucajCeo: 'Otključaj cijeli tekst',
  },

  mesecDanas: {
    oznaka: 'Mjesec danas',
    osvetljen: (pct) => `${pct}% osvijetljen`,
    naslov: (faza, uZnaku) => `${faza} ${uZnaku}`,
    slika: (naslov, pct, raste) => `${naslov}, osvijetljenost ${pct} posto, ${raste ? 'raste' : 'opada'}`,
    saznajVise: 'Saznaj više',
    nemaSaveta: 'Savjeti za ovu oblast još nisu stigli.',
    saveteKadVeza: 'Savjeti će se pojaviti kad se veza vrati.',
    zaTebe: 'Za tebe',
    tabovi: {
      ljubav: 'Ljubav',
      zdravlje: 'Zdravlje i ljepota',
      karijera: 'Karijera i finansije',
      kuca: 'Kuća',
      basta: 'Bašta',
    },
  },

  promena: {
    ulazi: (planeta, uZnak) => `${planeta} ulazi ${uZnak}`,
    retrogradna: (kljuc, planeta, uZnaku) =>
      `${zenska(kljuc) ? 'Retrogradna' : 'Retrogradni'} ${planeta} ${uZnaku}`,
    direktna: (kljuc, planeta, uZnaku) =>
      `${planeta} ponovo ${zenska(kljuc) ? 'direktna' : 'direktan'} ${uZnaku}`,
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
    poljeMinut: 'minut',
  },
};
