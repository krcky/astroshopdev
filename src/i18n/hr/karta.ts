/**
 * Prijevod `sr/karta.ts` (hrvatski): natalna karta, Nebo, Mjesec i listovi oko njih.
 * Znak u padezu ide kroz `nebo` (lokativ / akuzativ) — cijela recenica je jedna funkcija.
 */
import type { Recnik } from '../sr';
import { gramatika } from './gramatika';
import { nebo } from './nebo';

/** "2,3°" — decimalni zarez, jedna decimala. */
const stepenDecimalno = (x: number) => `${x.toFixed(1).replace('.', ',')}°`;

const MJESECI_PUNO = [
  'siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj',
  'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac',
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
    infoA11y: 'Što je natalna karta?',
    nemozeNaslov: 'Kartu nije moguće izračunati',
    nemozeOpis: (grad) =>
      `Ne možemo pouzdano utvrditi koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Pogreška od jednog sata pomakne ascendent za pola znaka, pa radije ne prikazujemo ništa nego pogrešne brojeve.`,
    javiNam: (zona) => `Javi nam ovo — zona: ${zona}`,
    rodjenje: (datum, vreme, grad) =>
      `${datum}${vreme ? ` u ${vreme}` : ''} · ${grad}`,
    tvojZnak: 'Tvoj znak',
    znakIli: (a, b) => `${a} ili ${b}`,
    uZnakuIli: (a, b) => `u ${nebo.znaci[a].lokativ} ili ${nebo.znaci[b].lokativ}`,
    bezVremena:
      'Vrijeme rođenja nije uneseno, pa su ascendent i kuće samo procjena. Položaji planeta su točni — osim Mjeseca, koji za 12 sati prijeđe i do 7°.',
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
    naslov: 'Trenutačno na nebu',
    infoA11y: 'Što je trenutačno nebo?',
    datumA11y: (datum) => `Datum: ${datum} Dodirni za odabir dana.`,
    mestoA11y: (grad) => `Mjesto promatranja: ${grad}. Dodirni za promjenu.`,
    dan: 'dan',
    sat: 'sat',
    trenutno: 'Sada',
    danNazad: 'Dan unatrag',
    satNazad: 'Sat unatrag',
    satNapred: 'Sat naprijed',
    danNapred: 'Dan naprijed',
    trenutnoA11y: 'Vrati se na sadašnji trenutak',
    bezPlacidusa: (grad) =>
      `Na zemljopisnoj širini mjesta ${grad} Placidusove kuće ne postoje — točke ekliptike koje ih određuju nikad se ne dižu iznad horizonta. Prikazane su Whole Sign kuće.`,
  },

  mesto: {
    naslov: 'Odakle gledaš',
    opis: 'Kuće i ascendent ovise o mjestu — nebo iznad Zagreba i iznad Sydneya u istom trenutku nije isto.',
    trazi: 'Traži grad',
    gradIzProfila: 'Grad iz tvog profila',
    trazimDalje: 'Tražim dalje…',
    nemaGrada: 'Nema grada s tim imenom. Pokušaj bez kvačica ili upiši veći grad u blizini.',
    vratiNa: (grad) => `Vrati na ${grad}`,
    napomena:
      'Ovime se mijenja samo zaslon „Trenutačno na nebu“. Tvoja natalna karta ostaje izračunata za mjesto rođenja — ono se mijenja u profilu.',
  },

  datumNeba: {
    naslov: 'Odaberi dan',
    opis: (grad, sat) => `Nebo nad mjestom ${grad} toga dana u ${sat}.`,
  },

  tumacenje: {
    osobaObrisana: 'Ova osoba više nije na tvom popisu.',
    nijeDeoKarte: 'Ovo tumačenje nije dio tvoje karte.',
    nijeDeoOveKarte: 'Ovo tumačenje nije dio ove karte.',
    tacnostAspekta: 'Točnost aspekta',
    orbisOd: (orbis, max) => `orbis ${orbis} od ${max}°`,
    polozajUZnaku: (z) => `Položaj ${nebo.uZnaku(z)}`,
    stepenOd30: (deg, min) => `${deg}° ${min}' od 30°`,
    mesecPresao: (od, u) =>
      `Na dan tvog rođenja Mjesec je bio ${nebo.uZnaku(od)}, a zatim prešao ${nebo.uZnak(u)}. Dok ne znamo vrijeme rođenja, ne znamo ni u kojem je znaku bio u trenutku tvog rođenja, pa tumačenje ne prikazujemo.`,
    mesecPresaoOsoba: (od, u) =>
      `Na dan rođenja Mjesec je bio ${nebo.uZnaku(od)}, a zatim prešao ${nebo.uZnak(u)}. Dok ne znamo vrijeme rođenja, ne znamo ni u kojem je znaku bio u trenutku rođenja, pa tumačenje ne prikazujemo.`,
    dodajVreme: 'Dodaj vrijeme rođenja',
    kucaBezVremena: 'U kojoj je kući planet, može se reći tek uz točno vrijeme rođenja. Kad ga uneseš, ovdje će biti i tumačenje kuće.',
    premiumNaslov: 'Tvoja cijela karta',
    premiumNaslovOsoba: 'Cijela karta ove osobe',
    premiumOpis: 'Sunce, Mjesec i podznak već su otvoreni. Ostali planeti u znakovima i kućama te svi aspekti dostupni su uz Premium.',
    premiumDugme: 'Otključaj cijelu kartu',
    nijeUcitano: 'Tumačenje se trenutačno ne može učitati. Provjeri internetsku vezu.',
    simbolikaAspekta: (aspekt, tema) => `${gramatika.veliko(aspekt)} – ${tema}`,
  },

  info: {
    retro: 'R pokraj planeta znači da je retrogradan: gledano sa Zemlje, prividno se kreće unatrag kroz zodijak.',
    krug: 'Krug',
    aspekti: 'Aspekti',
    aspektiUvod: 'Skladni su plavi, napeti ružičasti, a konjunkcija je siva.',
    aspektOznaka: (ugao, aspekt, tema) =>
      `${ugao}° · ${gramatika.veliko(aspekt)}${tema ? ` – ${tema}` : ''}`,
    aspektA11y: (ugao, aspekt, sim) =>
      `${ugao} stupnjeva, ${gramatika.veliko(aspekt)}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`,
  },

  natalnaInfo: {
    naslov: 'Što je natalna karta?',
    uvod: 'Natalna karta je slika neba u trenutku tvog rođenja: gdje su bili Sunce, Mjesec i planeti, u kojim znakovima i u kojim kućama. Zato je svačija karta drukčija, kao nebeska osobna iskaznica.',
    kakoSeCita: 'Kako se čita',
    planete: 'Planeti — što',
    planeteOpis: 'Svaki planet je jedna vrsta energije koja te pokreće.',
    znakovi: 'Znakovi — kako',
    znakoviOpis: 'Znak pokazuje kako se ta energija izražava. Isti planet u svakom od 12 znakova djeluje drukčije.',
    kuce: 'Kuće — gdje',
    kuceOpis: 'Krug je podijeljen na 12 kuća, a svaka je jedno područje života. Kuća pokazuje gdje planet djeluje.',
    aspekti: 'Aspekti — kako se slažu',
    aspektiOpis: 'Kutovi između planeta pokazuju nadopunjuju li se njihove energije ili se sudaraju.',
    krunica: 'Krunica — tvoj vladar',
    krunicaOpis: 'Planet s krunicom vlada znakom tvog podznaka. Tranzit u kojem on sudjeluje ima veću težinu.',
    krug: 'Vanjski prsten čini 12 znakova, a boja kruga oko znaka je njegov element. Brojevi od 1 do 12 su kuće, simboli su planeti. Lijevo je Ascendent, odnosno podznak: znak koji se dizao na istoku u trenutku tvog rođenja. Gore je MC, najviša točka neba u tom trenutku. Obojene linije u sredini su aspekti.',
    elementi: 'Elementi',
    elementiUvod: 'Svaki znak pripada jednom od četiri elementa.',
    elementA11y: (element, znaci) => `${element}: ${znaci.join(', ')}`,
    vremeRodjenja: 'Vrijeme rođenja',
    vremeRodjenjaOpis: 'Za podznak i kuće potrebno je točno vrijeme rođenja. Za jedan sat Zemlja se okrene toliko da se podznak pomakne za pola znaka. Kad vrijeme rođenja nije uneseno, krug nema kuća, Ascendenta ni MC-a, a lijevo je Ovan, prvi znak zodijaka.',
  },

  neboInfo: {
    naslov: 'Što je trenutačno nebo?',
    uvod: 'Nebo u ovom trenutku, gledano s odabranog mjesta: u kojem su znaku sada Sunce, Mjesec i planeti i kako stoje jedni prema drugima. Položaj planeta isti je za sve, na bilo kojem mjestu. O mjestu ovise kuće, 12 dijelova kruga, i one se pomiču iz minute u minutu.',
    strelice: 'Strelicama pomičeš sat i dan, a dodirom na datum biraš bilo koji dan.',
    krug: 'Vanjski prsten čini 12 znakova. Brojevi od 1 do 12 su kuće, simboli su planeti. Lijevo je Ascendent: znak koji se upravo diže na istoku. Gore je MC, najviša točka neba u ovom trenutku. Obojene linije u sredini su aspekti, a sivi simboli su točke.',
    tacke: 'Točke',
    tackeUvod: 'Čvor, Lilit i Točka sreće nisu nebeska tijela, nego točke koje se izračunavaju. Linije aspekata za njih se ne crtaju.',
    opisTacke: {
      northNode:
        'Mjesto gdje Mjesečeva putanja siječe prividnu putanju Sunca, idući prema sjeveru. Kreće se unatrag i jedan znak prijeđe za otprilike godinu i pol, zato uz njega gotovo uvijek stoji R. Prikazan je pravi čvor, ne srednji.',
      lilith:
        'Zove se i Crni Mjesec: točka Mjesečeve putanje najudaljenija od Zemlje. Kreće se naprijed i cijeli zodijak obiđe za otprilike devet godina. Prikazana je srednja Lilit jer prava zna odstupiti i do 30°.',
      fortune:
        'Ne vidi se na nebu, nego se izračunava iz Ascendenta, Sunca i Mjeseca. Zato se kreće brzo kao Ascendent i za jedan dan obiđe cijeli krug. Danju i noću računa se po drukčijoj formuli.',
    },
  },

  luna: {
    faze: {
      new: 'Mladi Mjesec', first: 'Prva četvrt', full: 'Pun Mjesec', last: 'Zadnja četvrt',
      waxing: 'Rastući Mjesec', waning: 'Opadajući Mjesec',
    },
    biljka: { vatra: 'Plod', zemlja: 'Korijen', vazduh: 'Cvijet', voda: 'List' },
    oblasti: { ljubav: 'Ljubav', zdravlje: 'Zdravlje', karijera: 'Karijera', kuca: 'Kuća', basta: 'Vrt' },
    fazaPrivremeno: {
      new: 'Početak novog lunarnog ciklusa, dobar trenutak za novu namjeru.',
      first: 'Prva prepreka na putu onoga što si započeo traži odluku i akciju.',
      full: 'Vrhunac ciklusa: osjećaji su jači, a stvari izlaze na vidjelo.',
      last: 'Vrijeme je za završavanje, pospremanje i otpuštanje onoga što ti više ne treba.',
      waxing: 'Energija raste, pa se lakše gradi i započinje.',
      waning: 'Energija opada, pa je vrijeme za završavanje i odmor.',
    },
    temeKuca: {
      1: 'ti i tvoje tijelo', 2: 'novac i vrijednosti', 3: 'komunikacija i okolina',
      4: 'dom i obitelj', 5: 'ljubav, kreativnost i djeca', 6: 'posao i zdravlje',
      7: 'partnerstva', 8: 'zajednički novac i promjene', 9: 'putovanja i učenje',
      10: 'karijera i ugled', 11: 'prijatelji i planovi', 12: 'odmor i unutarnji svijet',
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
    nazadNaDanas: 'Natrag na danas',
    osvetljen: (procenat, lunarniDan) => `${procenat} osvijetljen · ${lunarniDan}. lunarni dan`,
    biljka: 'Biljka',
    element: 'Element',
    saveti: 'Savjeti za ovo područje još nisu stigli.',
    savetiBezVeze: 'Savjeti će se pojaviti kad se veza vrati.',
    zaTebeDanas: 'Za tebe danas',
    zaTebeDan: (dan) => `Za tebe · ${dan}`,
    tacanU: (sat) => `Točan u ${sat}`,
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
    /** "Listopad 2026." — tocka iza godine, kao u datumu. */
    naslov: (mesec, godina) => `${gramatika.veliko(MJESECI_PUNO[mesec])} ${godina}.`,
    daniUNedelji: ['P', 'U', 'S', 'Č', 'P', 'S', 'N'],
  },
};
