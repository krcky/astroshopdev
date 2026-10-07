/**
 * Prijevod `sr/karta.ts` (bosanski): natalna karta, Nebo, Mjesec i listovi oko njih.
 * Znak u padezu ide kroz `nebo` (lokativ / akuzativ) — cijela recenica je jedna funkcija.
 */
import type { Recnik } from '../sr';
import { gramatika } from './gramatika';
import { nebo } from './nebo';

/** "2,3°" — decimalni zarez, jedna decimala. */
const stepenDecimalno = (x: number) => `${x.toFixed(1).replace('.', ',')}°`;

const MJESECI_PUNO = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar',
];

export const karta: Recnik['karta'] = {
  ascendent: 'Ascendent',
  podznak: 'Podznak',
  mc: 'MC',
  asc: 'ASC',
  retro: 'R',
  stepenDecimalno,
  kuca: (n) => `${n}. kuća`,
  uKuci: (n) => `u ${n}. kući`,
  uZnaku: (ime, z) => `${ime} ${nebo.uZnaku(z)}`,
  aspekt: (a, aspekt, b) => `${a} ${aspekt} ${b}`,
  aspektiNaslov: (n) => `Aspekti  ·  ${n}`,
  elementi: { vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Zrak', voda: 'Voda' },

  ti: {
    naslov: 'Natalna karta',
  },

  prikaz: {
    infoA11y: 'Šta je natalna karta?',
    nemozeNaslov: 'Karta se ne može izračunati',
    nemozeOpis: (grad) =>
      `Ne možemo pouzdano utvrditi koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Greška od jednog sata pomjeri ascendent za pola znaka, pa radije ne prikazujemo ništa nego pogrešne brojeve.`,
    javiNam: (zona) => `Javi nam ovo — zona: ${zona}`,
    rodjenje: (datum, vreme, grad) =>
      `${datum}${vreme ? ` u ${vreme}` : ''} · ${grad}`,
    tvojZnak: 'Tvoj znak',
    znakIli: (a, b) => `${a} ili ${b}`,
    uZnakuIli: (a, b) => `u ${nebo.znaci[a].lokativ} ili ${nebo.znaci[b].lokativ}`,
    bezVremena:
      'Vrijeme rođenja nije uneseno, pa su ascendent i kuće samo procjena. Pozicije planeta su tačne — osim Mjeseca, koji za 12 sati pređe i do 7°.',
    planetaA11y: (ime, znak, kuca) =>
      `${ime}, ${znak ?? 'znak nije siguran'}${kuca !== null ? `, ${kuca}. kuća` : ''}`,
    podRedA11y: (tekst, naslov, zakljucan) =>
      `${tekst}${naslov ? `: ${naslov}` : ''}${zakljucan ? '. Zaključano' : ''}. Tumačenje`,
    ugaoA11y: (ime, z) => `${ime} ${nebo.uZnaku(z)}. Tumačenje`,
  },

  lista: {
    tackaA11y: (ime, deg, min, znak, retro, kuca) =>
      `${ime}, ${deg}° ${min}' u znaku ${znak}${retro ? ', retrogradno' : ''}${kuca ? `, ${kuca}. kuća` : ''}`,
    nepoznat: 'Nepoznat',
    trojkaA11y: (oznaka, tekst, prica, tumacenje) =>
      `${oznaka}: ${tekst}${prica ? `. ${prica}` : tumacenje ? '. Tumačenje' : ''}`,
    aspektOrbisA11y: (ime, orbis) => `${ime}, orbis ${orbis}`,
    aspektA11y: (naslov, ime, zakljucan) =>
      `${naslov ? `${naslov}. ` : ''}${ime}${zakljucan ? '. Zaključano' : ''}. Tumačenje`,
  },

  nebo: {
    naslov: 'Trenutno na nebu',
    infoA11y: 'Šta je trenutno nebo?',
    datumA11y: (datum) => `Datum: ${datum} Dodirni da izabereš dan.`,
    mestoA11y: (grad) => `Mjesto posmatranja: ${grad}. Dodirni da promijeniš.`,
    dan: 'dan',
    sat: 'sat',
    trenutno: 'Trenutno',
    danNazad: 'Dan nazad',
    satNazad: 'Sat nazad',
    satNapred: 'Sat naprijed',
    danNapred: 'Dan naprijed',
    trenutnoA11y: 'Vrati se na sadašnji trenutak',
    bezPlacidusa: (grad) =>
      `Na geografskoj širini mjesta ${grad} Placidus kuće ne postoje — tačke ekliptike koje ih određuju nikad ne izlaze iznad horizonta. Prikazane su Whole Sign kuće.`,
  },

  mesto: {
    naslov: 'Odakle gledaš',
    opis: 'Kuće i ascendent zavise od mjesta — nebo iznad Sarajeva i iznad Sidneja u istom trenutku nije isto.',
    trazi: 'Traži grad',
    gradIzProfila: 'Grad iz tvog profila',
    trazimDalje: 'Tražim dalje…',
    nemaGrada: 'Nema grada pod tim imenom. Probaj bez kvačica ili napiši veći grad u blizini.',
    vratiNa: (grad) => `Vrati na ${grad}`,
    napomena:
      'Ovim se mijenja samo ekran „Trenutno na nebu“. Tvoja natalna karta ostaje računata za mjesto rođenja — ono se mijenja u profilu.',
  },

  datumNeba: {
    naslov: 'Izaberi dan',
    opis: (grad, sat) => `Nebo nad mjestom ${grad} tog dana u ${sat}.`,
  },

  tumacenje: {
    osobaObrisana: 'Ova osoba više nije na tvojoj listi.',
    nijeDeoKarte: 'Ovo tumačenje nije dio tvoje karte.',
    nijeDeoOveKarte: 'Ovo tumačenje nije dio ove karte.',
    tacnostAspekta: 'Tačnost aspekta',
    orbisOd: (orbis, max) => `orbis ${orbis} od ${max}°`,
    polozajUZnaku: (z) => `Položaj ${nebo.uZnaku(z)}`,
    stepenOd30: (deg, min) => `${deg}° ${min}' od 30°`,
    mesecPresao: (od, u) =>
      `Na dan tvog rođenja Mjesec je bio ${nebo.uZnaku(od)}, pa prešao ${nebo.uZnak(u)}. Dok ne znamo vrijeme rođenja, ne znamo ni u kojem je znaku bio u trenutku tvog rođenja, pa tumačenje ne prikazujemo.`,
    mesecPresaoOsoba: (od, u) =>
      `Na dan rođenja Mjesec je bio ${nebo.uZnaku(od)}, pa prešao ${nebo.uZnak(u)}. Dok ne znamo vrijeme rođenja, ne znamo ni u kojem je znaku bio u trenutku rođenja, pa tumačenje ne prikazujemo.`,
    dodajVreme: 'Dodaj vrijeme rođenja',
    kucaBezVremena: 'U kojoj je kući planeta, zavisi od tačnog vremena rođenja. Kad ga uneseš, ovdje će biti i tumačenje kuće.',
    premiumNaslov: 'Tvoja cijela karta',
    premiumNaslovOsoba: 'Cijela karta ove osobe',
    premiumOpis: 'Sunce, Mjesec i podznak su već otvoreni. Ostale planete i veze među njima su uz Premium.',
    premiumDugme: 'Otključaj cijelu kartu',
    nijeUcitano: 'Tumačenje se trenutno ne može učitati. Provjeri vezu sa internetom.',
    simbolikaAspekta: (aspekt, tema) => `${gramatika.veliko(aspekt)} – ${tema}`,
  },

  info: {
    retro: 'R pored planete znači da je retrogradna: gledano sa Zemlje, prividno ide unazad kroz zodijak.',
    krug: 'Krug',
    aspekti: 'Aspekti',
    aspektiUvod: 'Skladni su plavi, napeti roze, a konjunkcija je siva.',
    aspektOznaka: (ugao, aspekt, tema) =>
      `${ugao}° · ${gramatika.veliko(aspekt)}${tema ? ` – ${tema}` : ''}`,
    aspektA11y: (ugao, aspekt, sim) =>
      `${ugao} stepeni, ${gramatika.veliko(aspekt)}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`,
  },

  natalnaInfo: {
    naslov: 'Šta je natalna karta?',
    uvod: 'Natalna karta je slika neba u trenutku tvog rođenja: gdje su bili Sunce, Mjesec i planete, u kojim znacima i u kojim kućama. Zato je svačija karta drugačija, kao nebeska lična karta.',
    kakoSeCita: 'Kako se čita',
    planete: 'Planete — šta',
    planeteOpis: 'Svaka planeta je jedna vrsta energije koja te pokreće.',
    znakovi: 'Znakovi — kako',
    znakoviOpis: 'Znak pokazuje kako se ta energija izražava. Ista planeta u svakom od 12 znakova djeluje drugačije.',
    kuce: 'Kuće — gdje',
    kuceOpis: 'Krug je podijeljen na 12 kuća, a svaka je jedna oblast života. Kuća pokazuje gdje planeta djeluje.',
    aspekti: 'Aspekti — kako se slažu',
    aspektiOpis: 'Uglovi između planeta pokazuju da li im se energije dopunjuju ili sudaraju.',
    krunica: 'Krunica — tvoj vladar',
    krunicaOpis: 'Planeta sa krunicom vlada znakom tvog podznaka. Tranzit u kojem ona učestvuje ima veću težinu.',
    krug: 'Vanjski prsten je 12 znakova, a boja kruga oko znaka je njegov element. Brojevi od 1 do 12 su kuće, simboli su planete. Lijevo je Ascendent, odnosno podznak: znak koji se dizao na istoku u trenutku tvog rođenja. Gore je MC, najviša tačka neba u tom trenutku. Obojene linije u sredini su aspekti.',
    elementi: 'Elementi',
    elementiUvod: 'Svaki znak pripada jednom od četiri elementa.',
    elementA11y: (element, znaci) => `${element}: ${znaci.join(', ')}`,
    vremeRodjenja: 'Vrijeme rođenja',
    vremeRodjenjaOpis: 'Za podznak i kuće potrebno je tačno vrijeme rođenja. Za jedan sat Zemlja se okrene toliko da se podznak pomjeri za pola znaka. Kad vrijeme rođenja nije uneseno, krug nema kuća, Ascendenta ni MC-a, a lijevo je Ovan, prvi znak zodijaka.',
  },

  neboInfo: {
    naslov: 'Šta je trenutno nebo?',
    uvod: 'Nebo u ovom trenutku, gledano sa izabranog mjesta: u kojem su znaku sada Sunce, Mjesec i planete i kako stoje jedni prema drugima. Položaj planeta je isti za sve, bilo gdje da si. Od mjesta zavise kuće, 12 dijelova kruga, i one se pomjeraju iz minute u minutu.',
    strelice: 'Strelicama pomjeraš sat i dan, a dodirom na datum biraš bilo koji dan.',
    krug: 'Vanjski prsten je 12 znakova. Brojevi od 1 do 12 su kuće, simboli su planete. Lijevo je Ascendent: znak koji se upravo diže na istoku. Gore je MC, najviša tačka neba u ovom trenutku. Obojene linije u sredini su aspekti, a sivi simboli su tačke.',
    tacke: 'Tačke',
    tackeUvod: 'Čvor, Lilit i Tačka sreće nisu nebeska tijela, nego tačke koje se računaju. Linije aspekata se za njih ne crtaju.',
    opisTacke: {
      northNode:
        'Mjesto gdje Mjesečeva putanja presijeca prividni put Sunca, idući ka sjeveru. Ide unazad i jedan znak pređe za oko godinu i po dana, zato uz njega skoro uvijek stoji R. Prikazan je pravi čvor, ne srednji.',
      lilith:
        'Zove se i Crni Mjesec: tačka Mjesečeve putanje najudaljenija od Zemlje. Ide naprijed i cijeli zodijak obiđe za oko devet godina. Prikazana je srednja Lilit, jer prava zna da odstupi i do 30°.',
      fortune:
        'Ne vidi se na nebu, nego se računa iz Ascendenta, Sunca i Mjeseca. Zato ide brzo kao Ascendent i za dan obiđe cijeli krug. Danju i noću se računa po drugačijoj formuli.',
    },
  },

  luna: {
    faze: {
      new: 'Mlad Mjesec', first: 'Prva četvrt', full: 'Pun Mjesec', last: 'Posljednja četvrt',
      waxing: 'Rastući Mjesec', waning: 'Opadajući Mjesec',
    },
    biljka: { vatra: 'Plod', zemlja: 'Korijen', vazduh: 'Cvijet', voda: 'List' },
    oblasti: { ljubav: 'Ljubav', zdravlje: 'Zdravlje', karijera: 'Karijera', kuca: 'Kuća', basta: 'Bašta' },
    fazaPrivremeno: {
      new: 'Početak novog lunarnog ciklusa, dobar trenutak da postaviš namjeru.',
      first: 'Prva prepreka na putu onoga što si započeo traži odluku i akciju.',
      full: 'Vrhunac ciklusa: osjećanja su jača, a stvari izlaze na vidjelo.',
      last: 'Vrijeme da završiš, pospremiš i otpustiš ono što ti više ne treba.',
      waxing: 'Energija raste, pa se lakše gradi i započinje.',
      waning: 'Energija opada, pa je vrijeme za završavanje i odmor.',
    },
    temeKuca: {
      1: 'ti i tvoje tijelo', 2: 'novac i vrijednosti', 3: 'komunikacija i okolina',
      4: 'dom i porodica', 5: 'ljubav, kreativnost i djeca', 6: 'posao i zdravlje',
      7: 'partnerstva', 8: 'zajednički novac i promjene', 9: 'putovanja i učenje',
      10: 'karijera i ugled', 11: 'prijatelji i planovi', 12: 'odmor i unutrašnji svijet',
    },
    /** "Pun Mjesec u Biku", "Prva četvrt Mjeseca u Strijelcu". */
    naslov: (faza, lokativ) =>
      `${faza.includes('Mjesec') ? faza : `${faza} Mjeseca`} u ${lokativ}`,
  },

  mesec: {
    odSata: (sat, z) => `Od ${sat}, prije toga ${nebo.uZnaku(z)}`,
    doSata: (sat, z) => `Do ${sat}, zatim ${nebo.uZnaku(z)}`,
    lunarniKalendar: 'Lunarni kalendar',
    otvoriKalendarA11y: (datum) => `${datum}. Otvori kalendar`,
    danas: 'Danas',
    nazadNaDanas: 'Nazad na danas',
    osvetljen: (procenat, lunarniDan) => `${procenat} osvijetljen · ${lunarniDan}. lunarni dan`,
    biljka: 'Biljka',
    element: 'Element',
    saveti: 'Savjeti za ovu oblast još nisu stigli.',
    savetiBezVeze: 'Savjeti će se pojaviti kad se veza vrati.',
    zaTebeDanas: 'Za tebe danas',
    zaTebeDan: (dan) => `Za tebe · ${dan}`,
    tacanU: (sat) => `Tačan u ${sat}`,
    danRanije: 'Dan ranije',
    danKasnije: 'Dan kasnije',
    prethodniMesec: 'Prethodni mjesec',
    sledeciMesec: 'Sljedeći mjesec',
    ceoMesec: 'Cijeli mjesec',
    fazaU: (dan, sat) => `${dan} u ${sat}`,
    celijaA11y: (datum, faza) => `${datum}${faza ? `, ${faza}` : ''}`,
  },

  kalendar: {
    meseciPuno: MJESECI_PUNO,
    /** "Oktobar 2026." — tacka iza godine, kao u datumu. */
    naslov: (mesec, godina) => `${gramatika.veliko(MJESECI_PUNO[mesec])} ${godina}.`,
    daniUNedelji: ['P', 'U', 'S', 'Č', 'P', 'S', 'N'],
  },
};
