/**
 * Natalna karta (tab "Ti"), Nebo, Mesec i listovi oko njih. Jedan pod-objekat po ekranu
 * ili komponenti. Znak u padezu ide kroz `nebo` (lokativ / akuzativ) — CELA recenica je
 * jedna funkcija, jer drugi jezik ima drugi red reci.
 */
import { gramatika } from './gramatika';
import { nebo } from './nebo';

type Znak = keyof typeof nebo.znaci;

/** "2,3°" — decimalni zarez, jedna decimala. */
const stepenDecimalno = (x: number) => `${x.toFixed(1).replace('.', ',')}°`;

const MESECI_PUNO = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

export const karta = {
  /* --- zajednicko za "Ti", Nebo i tumacenja ------------------------------- */

  /** Ime ugla karte (lista, tumacenje, snimak karte za astrologa). */
  ascendent: 'Ascendent',
  /** Isti ugao u velikoj trojci i listi na "Ti" (UX recenzija 1.10.2026). */
  podznak: 'Podznak',
  /** Medium Coeli — skracenica, i u listi i na tocku. */
  mc: 'MC',
  /** Natpis Ascendenta na tocku (skracenica). */
  asc: 'ASC',
  /** Oznaka retrogradne planete — jedno slovo, uz stepen i na tocku. */
  retro: 'R',
  stepenDecimalno,
  /** "5. kuća" */
  kuca: (n: number) => `${n}. kuća`,
  /** "u 5. kući" */
  uKuci: (n: number) => `u ${n}. kući`,
  /** "Sunce u Lavu", "Ascendent u Ribama" */
  uZnaku: (ime: string, z: Znak) => `${ime} ${nebo.uZnaku(z)}`,
  /** "Sunce kvadrat Mars" — dva tela i ime aspekta. */
  aspekt: (a: string, aspekt: string, b: string) => `${a} ${aspekt} ${b}`,
  /** Naslov kartice aspekata, verzal dolazi iz stila: "Aspekti  ·  12". */
  aspektiNaslov: (n: number) => `Aspekti  ·  ${n}`,
  /** Elementi znakova (ekran Mesec, list "Šta je natalna karta"). */
  elementi: { vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Vazduh', voda: 'Voda' },

  /** `app/(tabs)/chart/index.tsx` — tab "Ti". */
  ti: {
    naslov: 'Natalna karta',
  },

  /** `components/natalna-karta-prikaz.tsx` — cela natalna karta ("Ti" i strana osobe). */
  prikaz: {
    infoA11y: 'Šta je natalna karta?',
    nemozeNaslov: 'Karta ne može da se izračuna',
    nemozeOpis: (grad: string) =>
      `Ne možemo pouzdano da utvrdimo koliko je sati bilo po UTC-u u mestu ${grad} na taj datum. Greška od sat vremena pomeri ascendent za pola znaka, pa radije ne prikazujemo ništa nego pogrešne brojeve.`,
    javiNam: (zona: string) => `Javi nam ovo — zona: ${zona}`,
    /** "10. jul 1990 u 14:05 · Beograd"; bez vremena rodjenja bez " u …". */
    rodjenje: (datum: string, vreme: string | null, grad: string) =>
      `${datum}${vreme ? ` u ${vreme}` : ''} · ${grad}`,
    /** Natpis balona oko Sunca u trojci — ulaz u pricu o znaku. */
    tvojZnak: 'Tvoj znak',
    /** Mesec bez vremena rodjenja: "Blizanci ili Rak". */
    znakIli: (a: string, b: string) => `${a} ili ${b}`,
    /** Isto u redu planete: "u Blizancima ili Raku". */
    uZnakuIli: (a: Znak, b: Znak) => `u ${nebo.znaci[a].lokativ} ili ${nebo.znaci[b].lokativ}`,
    bezVremena:
      'Vreme rođenja nije uneto, pa su ascendent i kuće samo procena. Pozicije planeta su tačne — osim Meseca, koji za 12 sati pređe i do 7°.',
    /** Citac ekrana, red planete: "Mars, Bik, 2. kuća"; `znak` null = nije siguran. */
    planetaA11y: (ime: string, znak: string | null, kuca: number | null) =>
      `${ime}, ${znak ?? 'znak nije siguran'}${kuca !== null ? `, ${kuca}. kuća` : ''}`,
    /** Citac ekrana, rasklopljen red: "u Raku: <naslov>. Zaključano. Tumačenje". */
    podRedA11y: (tekst: string, naslov: string, zakljucan: boolean) =>
      `${tekst}${naslov ? `: ${naslov}` : ''}${zakljucan ? '. Zaključano' : ''}. Tumačenje`,
    /** Citac ekrana, red Ascendenta: "Podznak u Ribama. Tumačenje". */
    ugaoA11y: (ime: string, z: Znak) => `${ime} ${nebo.uZnaku(z)}. Tumačenje`,
  },

  /** `components/karta-lista.tsx` — redovi ispod tocka ("Ti" i Nebo). */
  lista: {
    /** Citac ekrana, red tacke na Nebu. */
    tackaA11y: (ime: string, deg: number, min: number, znak: string, retro: boolean, kuca: number | undefined) =>
      `${ime}, ${deg}° ${min}' u znaku ${znak}${retro ? ', retrogradno' : ''}${kuca ? `, ${kuca}. kuća` : ''}`,
    /** Znak koji se ne zna (velika trojka). */
    nepoznat: 'Nepoznat',
    /** Citac ekrana, plocica trojke: "Sunce: Lav. Tvoj znak" / "Mesec: Rak. Tumačenje". */
    trojkaA11y: (oznaka: string, tekst: string, prica: string | null, tumacenje: boolean) =>
      `${oznaka}: ${tekst}${prica ? `. ${prica}` : tumacenje ? '. Tumačenje' : ''}`,
    /** Citac ekrana, aspekt bez tumacenja: "Sunce kvadrat Mars, orbis 1,4°". */
    aspektOrbisA11y: (ime: string, orbis: string) => `${ime}, orbis ${orbis}`,
    /** Citac ekrana, aspekt sa tumacenjem. */
    aspektA11y: (naslov: string, ime: string, zakljucan: boolean) =>
      `${naslov ? `${naslov}. ` : ''}${ime}${zakljucan ? '. Zaključano' : ''}. Tumačenje`,
  },

  /** `app/(tabs)/sky/index.tsx` — "Trenutno na nebu". */
  nebo: {
    naslov: 'Trenutno na nebu',
    /** Kad je vreme pomereno: naslov vise ne tvrdi "trenutno". */
    naslovPomereno: 'Nebo',
    infoA11y: 'Šta je trenutno nebo?',
    datumA11y: (datum: string) => `Datum: ${datum} Dodirni da izabereš dan.`,
    mestoA11y: (grad: string) => `Mesto posmatranja: ${grad}. Dodirni da promeniš.`,
    /** Natpisi na dugmadima sa strelicom (malo slovo). */
    dan: 'dan',
    sat: 'sat',
    trenutno: 'Trenutno',
    danNazad: 'Dan nazad',
    satNazad: 'Sat nazad',
    satNapred: 'Sat napred',
    danNapred: 'Dan napred',
    trenutnoA11y: 'Vrati se na sadašnji trenutak',
    nijeSadasnje: 'Ovo nije sadašnje nebo.',
    vratiNaSada: 'Vrati na sada',
    bezPlacidusa: (grad: string) =>
      `Na geografskoj širini mesta ${grad} Placidus kuće ne postoje — tačke ekliptike koje ih određuju nikad ne izlaze nad horizont. Prikazane su Whole Sign kuće.`,
  },

  /** `app/sky-place.tsx` — odakle se gleda nebo. */
  mesto: {
    naslov: 'Odakle gledaš',
    opis: 'Kuće i ascendent zavise od mesta — nebo iznad Beograda i iznad Sidneja u istom trenutku nije isto.',
    trazi: 'Traži grad',
    gradIzProfila: 'Grad iz tvog profila',
    trazimDalje: 'Tražim dalje…',
    nemaGrada: 'Nema grada pod tim imenom. Probaj bez kvačica ili napiši veći grad u blizini.',
    vratiNa: (grad: string) => `Vrati na ${grad}`,
    napomena:
      'Ovim se menja samo ekran „Trenutno na nebu“. Tvoja natalna karta ostaje računata za mesto rođenja — ono se menja u profilu.',
  },

  /** `app/sky-datum.tsx` — kalendar za Nebo. */
  datumNeba: {
    naslov: 'Izaberi dan',
    opis: (grad: string, sat: string) => `Nebo nad mestom ${grad} tog dana u ${sat}.`,
  },

  /** `app/natal.tsx` — tumacenje iz natalne karte. */
  tumacenje: {
    osobaObrisana: 'Ova osoba više nije na tvojoj listi.',
    nijeDeoKarte: 'Ovo tumačenje nije deo tvoje karte.',
    nijeDeoOveKarte: 'Ovo tumačenje nije deo ove karte.',
    tacnostAspekta: 'Tačnost aspekta',
    /** "orbis 2,3° od 6°" */
    orbisOd: (orbis: string, max: number) => `orbis ${orbis} od ${max}°`,
    /** "Položaj u Lavu" — traka polozaja u znaku. */
    polozajUZnaku: (z: Znak) => `Položaj ${nebo.uZnaku(z)}`,
    /** "16° 05' od 30°" */
    stepenOd30: (deg: number, min: string) => `${deg}° ${min}' od 30°`,
    /** Mesec bez vremena rodjenja presao iz znaka u znak — svoja karta. */
    mesecPresao: (od: Znak, u: Znak) =>
      `Na dan tvog rođenja Mesec je bio ${nebo.uZnaku(od)}, pa prešao ${nebo.uZnak(u)}. Bez vremena rođenja ne znamo u kom je znaku bio u trenutku tvog rođenja, pa tumačenje ne prikazujemo.`,
    /** Isto, karta druge osobe. */
    mesecPresaoOsoba: (od: Znak, u: Znak) =>
      `Na dan rođenja Mesec je bio ${nebo.uZnaku(od)}, pa prešao ${nebo.uZnak(u)}. Bez vremena rođenja ne znamo u kom je znaku bio u trenutku rođenja, pa tumačenje ne prikazujemo.`,
    dodajVreme: 'Dodaj vreme rođenja',
    kucaBezVremena: 'U kojoj je kući planeta zavisi od tačnog vremena rođenja. Kad ga uneseš, ovde će biti i tumačenje kuće.',
    premiumNaslov: 'Tvoja cela karta',
    premiumNaslovOsoba: 'Cela karta ove osobe',
    premiumOpis: 'Sunce, Mesec i podznak su već otvoreni. Ostale planete u znakovima i kućama i svi aspekti su uz Premium.',
    premiumDugme: 'Otključaj celu kartu',
    nijeUcitano: 'Tumačenje trenutno ne može da se učita. Proveri vezu sa internetom.',
    /** "Konjunkcija – Borba", kao u tekstu astrologa. */
    simbolikaAspekta: (aspekt: string, tema: string) => `${gramatika.veliko(aspekt)} – ${tema}`,
  },

  /** `components/info-list.tsx` + oba "i" lista — zajednicki delovi. */
  info: {
    retro: 'R pored planete znači da je retrogradna: gledano sa Zemlje, prividno ide unazad kroz zodijak.',
    krug: 'Krug',
    aspekti: 'Aspekti',
    aspektiUvod: 'Skladni su plavi, napeti roze, a konjunkcija je siva.',
    /** Natpis aspekta u legendi: "90° · Kvadrat – Izazov". */
    aspektOznaka: (ugao: number, aspekt: string, tema: string | null) =>
      `${ugao}° · ${gramatika.veliko(aspekt)}${tema ? ` – ${tema}` : ''}`,
    /** Citac ekrana, isti red: "90 stepeni, Kvadrat – Izazov. <opis>". */
    aspektA11y: (ugao: number, aspekt: string, sim: { tema: string; opis: string } | null) =>
      `${ugao} stepeni, ${gramatika.veliko(aspekt)}${sim ? ` – ${sim.tema}. ${sim.opis}` : ''}`,
  },

  /** `app/natalna-karta-info.tsx` — "Šta je natalna karta?". */
  natalnaInfo: {
    naslov: 'Šta je natalna karta?',
    uvod: 'Natalna karta je slika neba u trenutku tvog rođenja: gde su bili Sunce, Mesec i planete, u kojim znacima i u kojim kućama. Zato je svačija karta drugačija, kao nebeska lična karta.',
    kakoSeCita: 'Kako se čita',
    planete: 'Planete — šta',
    planeteOpis: 'Svaka planeta je jedna vrsta energije koja te pokreće.',
    znakovi: 'Znakovi — kako',
    znakoviOpis: 'Znak pokazuje kako se ta energija izražava. Ista planeta u svakom od 12 znakova deluje drugačije.',
    kuce: 'Kuće — gde',
    kuceOpis: 'Krug je podeljen na 12 kuća, a svaka je jedna oblast života. Kuća pokazuje gde planeta deluje.',
    aspekti: 'Aspekti — kako se slažu',
    aspektiOpis: 'Uglovi između planeta pokazuju da li im se energije dopunjuju ili sudaraju.',
    krunica: 'Krunica — tvoj vladar',
    krunicaOpis: 'Planeta sa krunicom vlada znakom tvog podznaka. Tranzit u kom ona učestvuje ima veću težinu.',
    krug: 'Spoljni prsten je 12 znakova, a boja kruga oko znaka je njegov element. Brojevi od 1 do 12 su kuće, simboli su planete. Levo je Ascendent, odnosno podznak: znak koji se dizao na istoku u trenutku tvog rođenja. Gore je MC, najviša tačka neba u tom trenutku. Obojene linije u sredini su aspekti.',
    elementi: 'Elementi',
    elementiUvod: 'Svaki znak pripada jednom od četiri elementa.',
    /** Citac ekrana: "Vatra: Ovan, Lav, Strelac". */
    elementA11y: (element: string, znaci: string[]) => `${element}: ${znaci.join(', ')}`,
    vremeRodjenja: 'Vreme rođenja',
    vremeRodjenjaOpis: 'Podznak i kuće zavise od tačnog vremena rođenja. Za sat vremena Zemlja se okrene toliko da se podznak pomeri za pola znaka. Kad vreme rođenja nije uneto, krug nema kuća, Ascendenta ni MC-a, a levo je Ovan, prvi znak zodijaka.',
  },

  /** `app/nebo-info.tsx` — "Šta je trenutno nebo?". */
  neboInfo: {
    naslov: 'Šta je trenutno nebo?',
    uvod: 'Nebo u ovom trenutku, gledano sa izabranog mesta: u kom su znaku sada Sunce, Mesec i planete i kako stoje jedni prema drugima. Položaj planeta je isti za sve, bilo gde da si. Od mesta zavise kuće, 12 delova kruga, i one se pomeraju iz minuta u minut.',
    strelice: 'Strelicama pomeraš sat i dan, a dodirom na datum biraš bilo koji dan.',
    krug: 'Spoljni prsten je 12 znakova. Brojevi od 1 do 12 su kuće, simboli su planete. Levo je Ascendent: znak koji se upravo diže na istoku. Gore je MC, najviša tačka neba u ovom trenutku. Obojene linije u sredini su aspekti, a sivi simboli su tačke.',
    tacke: 'Tačke',
    tackeUvod: 'Čvor, Lilit i Tačka sreće nisu nebeska tela, nego tačke koje se računaju. Linije aspekata se za njih ne crtaju.',
    /** Opis svake tacke — cinjenice, bez tumacenja. Kljucevi kao u `lib/points.ts`. */
    opisTacke: {
      northNode:
        'Mesto gde Mesečeva putanja preseca prividni put Sunca, idući ka severu. Ide unazad i jedan znak prođe za oko godinu i po dana, zato uz njega skoro uvek stoji R. Prikazan je pravi čvor, ne srednji.',
      lilith:
        'Zove se i Crni Mesec: tačka Mesečeve putanje najudaljenija od Zemlje. Ide napred i ceo zodijak obiđe za oko devet godina. Prikazana je srednja Lilit, jer prava zna da odstupi i do 30°.',
      fortune:
        'Ne vidi se na nebu, nego se računa iz Ascendenta, Sunca i Meseca. Zato ide brzo kao Ascendent i za dan obiđe ceo krug. Danju i noću se računa po drugačijoj formuli.',
    },
  },

  /** `lib/moon.ts` — natpisi uz Mesec (kljucevi za bazu se NE prevode). */
  luna: {
    /** Glavne faze i rastuci/opadajuci — kljucevi kao `PhaseKey`. */
    faze: {
      new: 'Mlad Mesec', first: 'Prva četvrt', full: 'Pun Mesec', last: 'Poslednja četvrt',
      waxing: 'Rastući Mesec', waning: 'Opadajući Mesec',
    },
    /** Deo biljke po elementu (biodinamicki kalendar). */
    biljka: { vatra: 'Plod', zemlja: 'Koren', vazduh: 'Cvet', voda: 'List' },
    /** Oblasti lunarnog kalendara — kljucevi kao `LunarArea` (deo kljuca u bazi). */
    oblasti: { ljubav: 'Ljubav', zdravlje: 'Zdravlje', karijera: 'Karijera', kuca: 'Kuća', basta: 'Bašta' },
    /** PRIVREMENO: jedna recenica po fazi dok astrolog ne posalje prave. */
    fazaPrivremeno: {
      new: 'Početak novog lunarnog ciklusa, dobar trenutak da postaviš nameru.',
      first: 'Prva prepreka na putu onoga što si započeo traži odluku i akciju.',
      full: 'Vrhunac ciklusa: osećanja su jača, a stvari izlaze na videlo.',
      last: 'Vreme da završiš, pospremiš i otpustiš ono što ti više ne treba.',
      waxing: 'Energija raste, pa se lakše gradi i započinje.',
      waning: 'Energija opada, pa je vreme za završavanje i odmor.',
    },
    /** Teme kuca za red "Za tebe" (ceka astrologa). */
    temeKuca: {
      1: 'ti i tvoje telo', 2: 'novac i vrednosti', 3: 'komunikacija i okolina',
      4: 'dom i porodica', 5: 'ljubav, kreativnost i deca', 6: 'posao i zdravlje',
      7: 'partnerstva', 8: 'zajednički novac i promene', 9: 'putovanja i učenje',
      10: 'karijera i ugled', 11: 'prijatelji i planovi', 12: 'odmor i unutrašnji svet',
    } as Record<number, string>,
    /**
     * Naslov ekrana Mesec i slike Mesec u prici: faza uvek sa recju "Mesec", pa znak —
     * "Pun Mesec u Biku", "Prva četvrt Meseca u Strelcu". `lokativ` je vec u padezu ("Biku").
     */
    naslov: (faza: string, lokativ: string) =>
      `${faza.includes('Mesec') ? faza : `${faza} Meseca`} u ${lokativ}`,
  },

  /** `app/moon.tsx` — ekran Mesec i lunarni kalendar. */
  mesec: {
    /** Mesec tog dana menja znak: posle prelaska / pre prelaska. */
    odSata: (sat: string, z: Znak) => `Od ${sat}, pre toga ${nebo.uZnaku(z)}`,
    doSata: (sat: string, z: Znak) => `Do ${sat}, zatim ${nebo.uZnaku(z)}`,
    lunarniKalendar: 'Lunarni kalendar',
    otvoriKalendarA11y: (datum: string) => `${datum}. Otvori kalendar`,
    danas: 'Danas',
    nazadNaDanas: 'Nazad na danas',
    /** "98% osvetljen · 14. lunarni dan" */
    osvetljen: (procenat: string, lunarniDan: number) => `${procenat} osvetljen · ${lunarniDan}. lunarni dan`,
    biljka: 'Biljka',
    element: 'Element',
    saveti: 'Saveti za ovu oblast još nisu stigli.',
    savetiBezVeze: 'Saveti će se pojaviti kad se veza vrati.',
    zaTebeDanas: 'Za tebe danas',
    zaTebeDan: (dan: string) => `Za tebe · ${dan}`,
    tacanU: (sat: string) => `Tačan u ${sat}`,
    danRanije: 'Dan ranije',
    danKasnije: 'Dan kasnije',
    prethodniMesec: 'Prethodni mesec',
    sledeciMesec: 'Sledeći mesec',
    ceoMesec: 'Ceo mesec',
    /** "14. okt u 22:05" — dan glavne faze u listi ispod kalendara. */
    fazaU: (dan: string, sat: string) => `${dan} u ${sat}`,
    /** Citac ekrana, celija kalendara: "14. okt, Pun Mesec". */
    celijaA11y: (datum: string, faza: string | null) => `${datum}${faza ? `, ${faza}` : ''}`,
  },

  /** `lib/lunarni-kalendar.ts` — mreza meseca (nedelja pocinje ponedeljkom). */
  kalendar: {
    /** Puna imena meseci, malim slovom (januar = 0). */
    meseciPuno: MESECI_PUNO,
    /** "Oktobar 2026" — naslov celog kalendara. */
    naslov: (mesec: number, godina: number) => `${gramatika.veliko(MESECI_PUNO[mesec])} ${godina}`,
    /** Zaglavlje kolona, PONEDELJAK PRVI — po jedno slovo. */
    daniUNedelji: ['P', 'U', 'S', 'Č', 'P', 'S', 'N'],
  },
};
