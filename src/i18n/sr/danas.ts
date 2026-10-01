/**
 * Tabovi, pocetna ("Danas"), tab "Tranziti", tumacenje tranzita i sve sto ih deli:
 * imena oblasti, ton, trajanje, "Tvoj dan", "Mesec danas", "Promene na nebu".
 * Jedan objekat po ekranu ili komponenti, sa imenom fajla u komentaru.
 */
export const danas = {
  /** `app/(tabs)/_layout.tsx` — natpisi ispod ikonica tabova; isti su i naslovi strana tabova. */
  tabovi: {
    danas: 'Danas',
    tranziti: 'Tranziti',
    pitaj: 'Pitaj',
    /** Natalna karta korisnika. */
    ti: 'Ti',
    nebo: 'Nebo',
  },

  /** `app/(tabs)/home/index.tsx` — pocetna. */
  pocetna: {
    /** Tabovi strane ispod zaglavlja (staklene kapsule). */
    tabTvojDan: 'Tvoj dan',
    tabMesec: 'Mesec',
    tabPromene: 'Promene',
    tabTeme: 'Teme',
    danasUkratko: 'Danas ukratko',
    /** Isti naslov kad se gleda drugi dan. */
    ukratko: 'Ukratko',
    ideTi: 'Ide ti',
    kociTe: 'Koči te',
    nemaTranzitaDana: 'Za ovaj dan nema izraženih tranzita.',
    promeneNadnaslov: 'Šta te čeka u narednom periodu',
    promeneNaslov: 'Promene na nebu',
    nemaPromena: 'Nijedna planeta uskoro ne menja znak ni smer.',
    temeNadnaslov: 'Tranziti koji traju nedeljama i mesecima',
    temeNaslov: 'Teme perioda',
    nemaTema: 'Ovih dana nijedna spora planeta nije u aspektu sa tvojom kartom.',
    /** "Još 4 u Tranzitima" — link na tab "Tranziti". */
    josUTranzitima: (n: number) => `Još ${n} u Tranzitima`,
    profil: 'Profil',
    /** Dan-meni: naslov iOS menija. */
    dan: 'Dan',
    promeniDan: 'Promeni dan',
    drugiDaniUzPremium: 'Drugi dani uz Premium',
    /** Citac ekrana: "Izabran dan: Juče. Promeni dan". */
    izabranDan: (dan: string, opis: string) => `Izabran dan: ${dan}. ${opis}`,
    /** Citac ekrana za dan pod katancem. */
    danUzPremium: (dan: string) => `${dan}. Uz Premium`,
    zatvoriMeni: 'Zatvori meni',
    /** Dani oko danas, od -2 do +2 (indeks = pomeraj + 2). */
    relativniDani: ['Prekjuče', 'Juče', 'Danas', 'Sutra', 'Prekosutra'],
  },

  /** Imena tranzita — lista, pocetna, tumacenje, "Tvoj dan" (`lib/oblasti.ts`, `lib/transits.ts`). */
  tranzit: {
    /** "Sunce konjunkcija Jupiter" — tranzitna planeta, aspekt, natalna tacka. */
    ime: (tranzitna: string, aspekt: string, natalna: string) => `${tranzitna} ${aspekt} ${natalna}`,
    /** "Sunce konjunkcija natalni Jupiter" — kad se vidi samo ime, bez teksta. */
    imeNatalni: (tranzitna: string, aspekt: string, natalna: string) => `${tranzitna} ${aspekt} natalni ${natalna}`,
    /** Ascendent i MC kao natalne mete tranzita. */
    ascendent: 'Ascendent',
    mc: 'MC',
    /** Trajanje Mesecevog tranzita. */
    samoDanas: 'Samo danas',
    /** "U tvojoj 5. kući" — redni broj kuce. */
    uTvojojKuci: (kuca: number) => `U tvojoj ${kuca}. kući`,
    /** Mlad/Pun Mesec u kuci: veci tekst "Novi početak: ljubav…", manji "Mlad Mesec u tvojoj 5. kući". */
    lunacijaVeci: (naslov: string, tema: string) => `${naslov}: ${tema}`,
    lunacijaManji: (faza: string, kuca: number) => `${faza} u tvojoj ${kuca}. kući`,
  },

  /** `lib/oblasti-config.ts` — oblasti zivota i ocene dana. */
  oblasti: {
    imena: {
      ljubav: 'Ljubav',
      zdravlje: 'Zdravlje i lepota',
      karijera: 'Karijera i finansije',
      kuca: 'Kuća i bašta',
    },
    /** Kratka oznaka uz ocenu 1—5. */
    oznakaOcene: { 5: 'Odličan dan', 4: 'Dobar dan', 3: 'Miran dan', 2: 'Oprezno', 1: 'Težak dan' } as Record<number, string>,
    /** Naslov reda za Mlad i Pun Mesec u natalnoj kuci. */
    lunacijaMlad: 'Novi početak',
    lunacijaPun: 'Vrhunac',
  },

  /** `components/ocena-oblasti.tsx` — citac ekrana. */
  ocene: {
    otvorena: (oblast: string, ocena: number, oznaka: string) => `${oblast}, ocena ${ocena} od 5, ${oznaka}`,
    zakljucana: (oblast: string) => `${oblast}, uz Premium`,
    otvaraPremium: 'Otvara Premium',
    otvaraTranzite: 'Otvara tranzite',
  },

  /** `lib/tone.ts`, `components/ton.tsx`, `components/tone-badge.tsx` — ton tranzita. */
  ton: {
    povoljno: 'Povoljno',
    izazovno: 'Izazovno',
    mesovito: 'Mešovito',
    /** Citac ekrana: "Ton: Povoljno". */
    oznaka: (ton: string) => `Ton: ${ton}`,
  },

  /** `components/tranziti-lista.tsx` — tab "Tranziti" i kartica tranzita. */
  tranziti: {
    nemaNaKarti: 'Danas nema tranzita na ovu kartu.',
    nemaTvojih: 'Danas nema tvojih tranzita.',
    /** "Još 5 tranzita danas" — `tranzita` je rec uz broj (`gramatika.tranzita`). */
    josDanas: (n: number, tranzita: string) => `Još ${n} ${tranzita} danas`,
    zakljucaniOpis: 'Najjači su otvoreni na vrhu liste. I ostali utiču na tvoj dan, i svaki ima svoje celo tumačenje.',
    otkljucajSve: 'Otključaj sve tranzite',
    otvaraCeoTekst: 'Otvara ceo tekst tranzita',
  },

  /** `components/transit-trajanje.tsx` — traka trajanja. */
  trajanje: {
    /** "Od 13. sep" */
    od: (dan: string) => `Od ${dan}`,
    duzeOdTriGodine: 'Traje duže od tri godine',
  },

  /** `components/tvoj-dan-card.tsx` — kartica "Tvoj dan". */
  tvojDan: {
    /** Verzal oznaka iznad naslova, uz datum. */
    oznaka: 'Tvoj dan',
    zastoOvajTekst: 'Zašto baš ovaj tekst?',
    saznajVise: 'Saznaj više',
    /** Oznake tri stavke iz teksta. */
    efekat: 'Pozitivni efekat',
    pazi: 'Izazov',
    savet: 'Savet',
  },

  /** `app/tvoj-dan-info.tsx` — list "Zašto baš ovaj tekst?". */
  tvojDanInfo: {
    naslov: 'Zašto baš ovaj tekst?',
    uvod: 'Tekst je napisan za tranzit koji je danas najvažniji u tvojoj natalnoj karti.',
    tranzitDana: 'Tranzit dana',
    /** Ugao aspekta u stepenima. */
    objasnjenje: (ugao: number) => `Planeta sa današnjeg neba i ugao od ${ugao}° koji zaklapa sa tačkom iz tvoje natalne karte.`,
    tranzitVladara: 'Tranzit tvog vladara',
    nijeDeoKarte: 'Ovaj tranzit nije deo tvoje karte.',
    /** `lib/tvoj-dan.ts` — vladar je natalna tacka. `uZnaku` = "u Ribama". */
    vladarNatalni: (planeta: string, uZnaku: string) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}. Kad ga tranzit dodirne, dan se oseća ličnije i jače, zato ovaj tranzit danas ima prednost.`,
    /** Vladar je tranzitna planeta; `koga` je iz `tvojAkuzativ`. */
    vladarTranzitni: (planeta: string, uZnaku: string, koga: string) =>
      `${planeta} je vladar tvog Ascendenta ${uZnaku}, a danas pokreće ${koga}. Zato ovaj tranzit danas ima prednost.`,
    /** "tvoje Sunce", "tvoju Veneru" — akuzativ sa prisvojnom zamenicom. */
    tvojAkuzativ: {
      sun: 'tvoje Sunce', moon: 'tvoj Mesec', mercury: 'tvoj Merkur', venus: 'tvoju Veneru',
      mars: 'tvog Marsa', jupiter: 'tvog Jupitera', saturn: 'tvog Saturna', uranus: 'tvog Urana',
      neptune: 'tvog Neptuna', pluto: 'tvog Plutona', ascendant: 'tvoj Ascendent', midheaven: 'tvoj MC',
    } as Record<string, string>,
  },

  /** `app/transit.tsx` — ceo tekst tranzita. */
  tumacenje: {
    osobaViseNije: 'Ova osoba više nije na tvojoj listi.',
    /** Naslov dok tekst nema svoj. */
    tranzit: 'Tranzit',
    nijeNapisano: 'Tumačenje za ovaj tranzit još nije napisano.',
    stizeKadVeza: 'Ceo tekst će se pojaviti kad se veza vrati.',
    procitajDoKraja: 'Pročitaj do kraja',
    /** Naslov ostalih pasusa duge verzije, posle odeljaka. */
    viseOTranzitu: 'Više o ovom tranzitu',
    /** Kartica na dnu tumacenja: pitanje astrologu o ovom tranzitu. */
    pitajNaslov: 'Pitaj astrologa o ovom tranzitu',
    pitajOpis: (astrolog: string, oOsobi: boolean) =>
      `${astrolog} vidi ${oOsobi ? 'kartu ove osobe' : 'tvoju kartu'} i odgovara glasovnom porukom, obično za 2–3 radna dana.`,
    postaviPitanje: 'Postavi pitanje',
    kratkaVerzija: 'Ovo je kratka verzija. U celoj su oblasti života na koje tranzit deluje, dugoročni efekti i konkretni saveti.',
    otkljucajCeo: 'Otključaj ceo tekst',
  },

  /** `components/mesec-danas-card.tsx` — tab "Mesec" na pocetnoj. */
  mesecDanas: {
    /** "MESEC DANAS · 91% osvetljen" — verzal oznaka. */
    oznaka: 'Mesec danas',
    osvetljen: (pct: number) => `${pct}% osvetljen`,
    /** "Rastući Mesec u Lavu" — `uZnaku` = "u Lavu". */
    naslov: (faza: string, uZnaku: string) => `${faza} ${uZnaku}`,
    /** Citac ekrana uz crtez Meseca. */
    slika: (naslov: string, pct: number, raste: boolean) => `${naslov}, osvetljenost ${pct} posto, ${raste ? 'raste' : 'opada'}`,
    saznajVise: 'Saznaj više',
    nemaSaveta: 'Saveti za ovu oblast još nisu stigli.',
    saveteKadVeza: 'Saveti će se pojaviti kad se veza vrati.',
    zaTebe: 'Za tebe',
    /** Kapsule oblasti lunarnog kalendara. */
    tabovi: {
      ljubav: 'Ljubav',
      zdravlje: 'Zdravlje i lepota',
      karijera: 'Karijera i finansije',
      kuca: 'Kuća',
      basta: 'Bašta',
    },
  },

  /** `components/promena-na-nebu.tsx` — kartica "Promene na nebu". */
  promena: {
    /** "Mars ulazi u Lava" — `uZnak` = "u Lava" (akuzativ). */
    ulazi: (planeta: string, uZnak: string) => `${planeta} ulazi ${uZnak}`,
    /** "Retrogradna Venera u Škorpiji" — rod po planeti (`kljuc`); `uZnaku` = lokativ. */
    retrogradna: (kljuc: string, planeta: string, uZnaku: string) =>
      `${kljuc === 'venus' ? 'Retrogradna' : 'Retrogradni'} ${planeta} ${uZnaku}`,
    /** "Mars ponovo direktan u Lavu". */
    direktna: (kljuc: string, planeta: string, uZnaku: string) =>
      `${planeta} ponovo ${kljuc === 'venus' ? 'direktna' : 'direktan'} ${uZnaku}`,
    /** "Traje do 14. nov" / "Traje još godinama". */
    traje: (doKad: string) => `Traje ${doKad}`,
  },

  /** `lib/horoscope.ts` — kratak opis neba (`skyline`). */
  horoskop: {
    /** "Mesec u znaku Lav · Rastući Mesec · retrogradni: Merkur, Saturn" */
    nebo: (znak: string, faza: string, retrogradni: string[]) =>
      `Mesec u znaku ${znak} · ${faza}` + (retrogradni.length ? ` · retrogradni: ${retrogradni.join(', ')}` : ''),
  },

  /** `components/ui/` — zajednicki delovi. */
  ui: {
    /** `ui/text-placeholder.tsx` — citac ekrana dok tekst stize. */
    ucitavam: 'Učitavam',
    /** `ui/wheel-picker.tsx` — natpisi polja na vebu. */
    poljeDan: 'dan',
    poljeMesec: 'mesec',
    poljeGodina: 'godina',
    poljeSat: 'sat',
    poljeMinut: 'minut',
  },
};
