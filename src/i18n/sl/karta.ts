/**
 * Prevod `sr/karta.ts` (slovenski): rojstna karta, Nebo, Luna in listi okoli njih.
 * Znamenje v sklonu gre skozi `nebo` (mestnik / tozilnik) — CELA poved je ena funkcija.
 */
import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';
import { nebo } from './nebo';

/** "2,3°" — decimalna vejica, ena decimalka. */
const stepenDecimalno = (x: number) => `${x.toFixed(1).replace('.', ',')}°`;

const MESECI_PUNO = [
  'januar', 'februar', 'marec', 'april', 'maj', 'junij',
  'julij', 'avgust', 'september', 'oktober', 'november', 'december',
];

export const karta: Recnik['karta'] = {
  ascendent: 'Ascendent',
  podznak: 'Ascendent',
  mc: 'MC',
  asc: 'ASC',
  retro: 'R',
  stepenDecimalno,
  kuca: (n) => `${n}. hiša`,
  uKuci: (n) => `v ${n}. hiši`,
  uZnaku: (ime, z) => `${ime} ${nebo.uZnaku(z)}`,
  aspekt: (a, aspekt, b) => `${a} ${aspekt} ${b}`,
  aspektiNaslov: (n) => `Aspekti  ·  ${n}`,
  elementi: { vatra: 'Ogenj', zemlja: 'Zemlja', vazduh: 'Zrak', voda: 'Voda' },

  ti: {
    naslov: 'Rojstna karta',
  },

  prikaz: {
    infoA11y: 'Kaj je rojstna karta?',
    nemozeNaslov: 'Karte ni mogoče izračunati',
    nemozeOpis: (grad) =>
      `Ne moremo zanesljivo ugotoviti, koliko je bila ura po UTC v kraju ${grad} na ta datum. Napaka ene ure premakne ascendent za pol znamenja, zato raje ne prikažemo ničesar kot napačne številke.`,
    javiNam: (zona) => `Sporoči nam to — časovni pas: ${zona}`,
    rodjenje: (datum, vreme, grad) => `${datum}${vreme ? ` ob ${vreme}` : ''} · ${grad}`,
    tvojZnak: 'Tvoje znamenje',
    znakIli: (a, b) => `${a} ali ${b}`,
    uZnakuIli: (a, b) => `v ${nebo.znaci[a].lokativ} ali ${nebo.znaci[b].lokativ}`,
    bezVremena:
      'Ura rojstva ni vnesena, zato sta ascendent in hiše le ocena. Položaji planetov so točni — razen Lune, ki se v 12 urah premakne tudi do 7°.',
    planetaA11y: (ime, znak, kuca) =>
      `${ime}, ${znak ?? 'znamenje ni zanesljivo'}${kuca !== null ? `, ${kuca}. hiša` : ''}`,
    podRedA11y: (tekst, naslov, zakljucan) =>
      `${tekst}${naslov ? `: ${naslov}` : ''}${zakljucan ? '. Zaklenjeno' : ''}. Razlaga`,
    ugaoA11y: (ime, z) => `${ime} ${nebo.uZnaku(z)}. Razlaga`,
  },

  lista: {
    tackaA11y: (ime, deg, min, znak, retro, kuca) =>
      `${ime}, ${deg}° ${min}' v znamenju ${znak}${retro ? ', retrogradno' : ''}${kuca ? `, ${kuca}. hiša` : ''}`,
    nepoznat: 'Neznano',
    trojkaA11y: (oznaka, tekst, prica, tumacenje) =>
      `${oznaka}: ${tekst}${prica ? `. ${prica}` : tumacenje ? '. Razlaga' : ''}`,
    aspektOrbisA11y: (ime, orbis) => `${ime}, orbis ${orbis}`,
    aspektA11y: (naslov, ime, zakljucan) =>
      `${naslov ? `${naslov}. ` : ''}${ime}${zakljucan ? '. Zaklenjeno' : ''}. Razlaga`,
  },

  nebo: {
    naslov: 'Trenutno na nebu',
    infoA11y: 'Kaj je trenutno nebo?',
    datumA11y: (datum) => `Datum: ${datum} Dotakni se, da izbereš dan.`,
    mestoA11y: (grad) => `Kraj opazovanja: ${grad}. Dotakni se, da ga spremeniš.`,
    dan: 'dan',
    sat: 'ura',
    trenutno: 'Zdaj',
    danNazad: 'Dan nazaj',
    satNazad: 'Ura nazaj',
    satNapred: 'Ura naprej',
    danNapred: 'Dan naprej',
    trenutnoA11y: 'Vrni se na sedanji trenutek',
    bezPlacidusa: (grad) =>
      `Na zemljepisni širini kraja ${grad} Placidusove hiše ne obstajajo — točke ekliptike, ki jih določajo, se nikoli ne dvignejo nad obzorje. Prikazane so hiše Whole Sign.`,
  },

  mesto: {
    naslov: 'Od kod gledaš',
    opis: 'Hiše in ascendent so odvisni od kraja — nebo nad Ljubljano in nad Sydneyjem v istem trenutku ni enako.',
    trazi: 'Poišči mesto',
    gradIzProfila: 'Mesto iz tvojega profila',
    trazimDalje: 'Iščem naprej…',
    nemaGrada: 'Mesta s tem imenom ni. Poskusi brez strešic ali vpiši večje mesto v bližini.',
    vratiNa: (grad) => `Vrni na ${grad}`,
    napomena:
      'S tem se spremeni samo zaslon „Trenutno na nebu“. Tvoja rojstna karta ostane izračunana za kraj rojstva — tega spremeniš v profilu.',
  },

  datumNeba: {
    naslov: 'Izberi dan',
    opis: (grad, sat) => `Nebo nad krajem ${grad} tisti dan ob ${sat}.`,
  },

  tumacenje: {
    osobaObrisana: 'Te osebe ni več na tvojem seznamu.',
    nijeDeoKarte: 'Ta razlaga ni del tvoje karte.',
    nijeDeoOveKarte: 'Ta razlaga ni del te karte.',
    tacnostAspekta: 'Natančnost aspekta',
    orbisOd: (orbis, max) => `orbis ${orbis} od ${max}°`,
    polozajUZnaku: (z) => `Položaj ${nebo.uZnaku(z)}`,
    stepenOd30: (deg, min) => `${deg}° ${min}' od 30°`,
    mesecPresao: (od, u) =>
      `Na dan tvojega rojstva je bila Luna ${nebo.uZnaku(od)}, nato pa je prešla ${nebo.uZnak(u)}. Brez časa rojstva ne vemo, v katerem znamenju je bila v trenutku tvojega rojstva, zato razlage ne prikažemo.`,
    mesecPresaoOsoba: (od, u) =>
      `Na dan rojstva je bila Luna ${nebo.uZnaku(od)}, nato pa je prešla ${nebo.uZnak(u)}. Brez časa rojstva ne vemo, v katerem znamenju je bila v trenutku rojstva, zato razlage ne prikažemo.`,
    dodajVreme: 'Dodaj uro rojstva',
    kucaBezVremena: 'V kateri hiši je planet, je odvisno od natančnega časa rojstva. Ko ga vneseš, bo tu tudi razlaga hiše.',
    premiumNaslov: 'Tvoja celotna karta',
    premiumNaslovOsoba: 'Celotna karta te osebe',
    premiumOpis: 'Sonce, Luna in ascendent so že odklenjeni. Ostali planeti v znamenjih in hišah ter vsi aspekti so na voljo s Premiumom.',
    premiumDugme: 'Odkleni celotno karto',
    nijeUcitano: 'Razlage trenutno ni mogoče naložiti. Preveri internetno povezavo.',
    simbolikaAspekta: (aspekt, tema) => `${gramatika.veliko(aspekt)} – ${tema}`,
  },

  info: {
    retro: 'R ob planetu pomeni, da je retrograden: gledano z Zemlje se navidezno premika nazaj po zodiaku.',
    krug: 'Krog',
    aspekti: 'Aspekti',
    aspektiUvod: 'Skladni so modri, napeti rožnati, konjunkcija pa je siva.',
    aspektOznaka: (ugao, aspekt, tema) =>
      `${ugao}° · ${gramatika.veliko(aspekt)}${tema ? ` – ${tema}` : ''}`,
    aspektA11y: (ugao, aspekt, sim) =>
      `${ugao} ${mnozina(ugao, ['stopinja', 'stopinji', 'stopinje', 'stopinj'])}, ${gramatika.veliko(aspekt)}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`,
  },

  natalnaInfo: {
    naslov: 'Kaj je rojstna karta?',
    uvod: 'Rojstna karta je slika neba v trenutku tvojega rojstva: kje so bili Sonce, Luna in planeti, v katerih znamenjih in v katerih hišah. Zato je karta vsakogar drugačna, kot nebesna osebna izkaznica.',
    kakoSeCita: 'Kako se bere',
    planete: 'Planeti — kaj',
    planeteOpis: 'Vsak planet je ena vrsta energije, ki te žene.',
    znakovi: 'Znamenja — kako',
    znakoviOpis: 'Znamenje pokaže, kako se ta energija izraža. Isti planet v vsakem od 12 znamenj deluje drugače.',
    kuce: 'Hiše — kje',
    kuceOpis: 'Krog je razdeljen na 12 hiš, vsaka pa je eno področje življenja. Hiša pokaže, kje planet deluje.',
    aspekti: 'Aspekti — kako se ujemajo',
    aspektiOpis: 'Koti med planeti pokažejo, ali se njihove energije dopolnjujejo ali spopadajo.',
    krunica: 'Kronica — tvoj vladar',
    krunicaOpis: 'Planet s kronico vlada znamenju tvojega ascendenta. Tranzit, v katerem sodeluje, ima večjo težo.',
    krug: 'Zunanji obroč je 12 znamenj, barva kroga okoli znamenja pa je njegov element. Številke od 1 do 12 so hiše, simboli so planeti. Levo je ascendent oziroma podznak: znamenje, ki je v trenutku tvojega rojstva vzhajalo na vzhodu. Zgoraj je MC, najvišja točka neba v tistem trenutku. Barvne črte v sredini so aspekti.',
    elementi: 'Elementi',
    elementiUvod: 'Vsako znamenje pripada enemu od štirih elementov.',
    elementA11y: (element, znaci) => `${element}: ${znaci.join(', ')}`,
    vremeRodjenja: 'Ura rojstva',
    vremeRodjenjaOpis: 'Ascendent in hiše so odvisni od natančne ure rojstva. V eni uri se Zemlja zavrti toliko, da se ascendent premakne za pol znamenja. Ko ura rojstva ni vnesena, krog nima hiš, ascendenta in MC-ja, levo pa je Oven, prvo znamenje zodiaka.',
  },

  neboInfo: {
    naslov: 'Kaj je trenutno nebo?',
    uvod: 'Nebo v tem trenutku, gledano z izbranega kraja: v katerem znamenju so zdaj Sonce, Luna in planeti ter kako stojijo drug proti drugemu. Položaj planetov je enak za vse, kjer koli si. Od kraja so odvisne hiše, 12 delov kroga, ki se premikajo iz minute v minuto.',
    strelice: 'S puščicami premikaš uro in dan, z dotikom datuma pa izbereš katerikoli dan.',
    krug: 'Zunanji obroč je 12 znamenj. Številke od 1 do 12 so hiše, simboli so planeti. Levo je ascendent: znamenje, ki prav zdaj vzhaja na vzhodu. Zgoraj je MC, najvišja točka neba v tem trenutku. Barvne črte v sredini so aspekti, sivi simboli pa so točke.',
    tacke: 'Točke',
    tackeUvod: 'Vozlišče, Lilit in Točka sreče niso nebesna telesa, ampak točke, ki se izračunajo. Črte aspektov se zanje ne rišejo.',
    opisTacke: {
      northNode:
        'Mesto, kjer Lunina pot seka navidezno pot Sonca, ko gre proti severu. Premika se nazaj in eno znamenje prepotuje v približno letu in pol, zato ob njem skoraj vedno stoji R. Prikazano je pravo vozlišče, ne srednje.',
      lilith:
        'Imenuje se tudi Črna Luna: točka Lunine poti, ki je najbolj oddaljena od Zemlje. Premika se naprej in ves zodiak obkroži v približno devetih letih. Prikazana je srednja Lilit, ker prava lahko odstopa tudi do 30°.',
      fortune:
        'Na nebu se ne vidi, ampak se izračuna iz ascendenta, Sonca in Lune. Zato se premika hitro kot ascendent in v enem dnevu obkroži ves krog. Podnevi in ponoči se izračuna po drugačni formuli.',
    },
  },

  luna: {
    faze: {
      new: 'Mlaj', first: 'Prvi krajec', full: 'Polna Luna', last: 'Zadnji krajec',
      waxing: 'Naraščajoča Luna', waning: 'Pojemajoča Luna',
    },
    biljka: { vatra: 'Plod', zemlja: 'Korenina', vazduh: 'Cvet', voda: 'List' },
    oblasti: { ljubav: 'Ljubezen', zdravlje: 'Zdravje', karijera: 'Kariera', kuca: 'Dom', basta: 'Vrt' },
    fazaPrivremeno: {
      new: 'Začetek novega luninega cikla, dober trenutek, da si postaviš namero.',
      first: 'Prva ovira na poti tega, kar se je začelo, zahteva odločitev in dejanje.',
      full: 'Vrhunec cikla: čustva so močnejša, stvari pa pridejo na dan.',
      last: 'Čas, da zaključiš, pospraviš in spustiš tisto, česar ne potrebuješ več.',
      waxing: 'Energija raste, zato je lažje graditi in začenjati.',
      waning: 'Energija upada, zato je čas za zaključevanje in počitek.',
    },
    temeKuca: {
      1: 'ti in tvoje telo', 2: 'denar in vrednote', 3: 'komunikacija in okolica',
      4: 'dom in družina', 5: 'ljubezen, ustvarjalnost in otroci', 6: 'delo in zdravje',
      7: 'partnerstva', 8: 'skupni denar in spremembe', 9: 'potovanja in učenje',
      10: 'kariera in ugled', 11: 'prijatelji in načrti', 12: 'počitek in notranji svet',
    },
    /** "Polna Luna v Biku", "Prvi krajec v Strelcu" — `lokativ` je ze v sklonu. */
    naslov: (faza, lokativ) => `${faza} v ${lokativ}`,
  },

  mesec: {
    odSata: (sat, z) => `Od ${sat}, pred tem ${nebo.uZnaku(z)}`,
    doSata: (sat, z) => `Do ${sat}, nato ${nebo.uZnaku(z)}`,
    lunarniKalendar: 'Lunin koledar',
    otvoriKalendarA11y: (datum) => `${datum}. Odpri koledar`,
    danas: 'Danes',
    nazadNaDanas: 'Nazaj na danes',
    osvetljen: (procenat, lunarniDan) => `${procenat} osvetljena · ${lunarniDan}. lunin dan`,
    biljka: 'Rastlina',
    element: 'Element',
    saveti: 'Nasveti za to področje še niso prispeli.',
    savetiBezVeze: 'Nasveti se bodo prikazali, ko bo povezava spet vzpostavljena.',
    zaTebeDanas: 'Zate danes',
    zaTebeDan: (dan) => `Zate · ${dan}`,
    tacanU: (sat) => `Natančen ob ${sat}`,
    danRanije: 'Dan prej',
    danKasnije: 'Dan pozneje',
    prethodniMesec: 'Prejšnji mesec',
    sledeciMesec: 'Naslednji mesec',
    ceoMesec: 'Ves mesec',
    fazaU: (dan, sat) => `${dan} ob ${sat}`,
    celijaA11y: (datum, faza) => `${datum}${faza ? `, ${faza}` : ''}`,
  },

  kalendar: {
    meseciPuno: MESECI_PUNO,
    naslov: (mesec, godina) => `${gramatika.veliko(MESECI_PUNO[mesec])} ${godina}`,
    daniUNedelji: ['P', 'T', 'S', 'Č', 'P', 'S', 'N'],
  },
};
