/** Koraci onboardinga, prijava i nalog. Jedan objekat po ekranu, redom kao u toku. */
export const onboarding = {
  /** `components/onboarding-step.tsx` — zajednicki okvir svih koraka. */
  korak: {
    odustani: 'Odustani',
    /** Podrazumevana recenica iznad dugmeta (i u `place.tsx` kad je grad izabran). */
    privatnost: 'Koristimo ovo da izračunamo tvoju natalnu kartu. Ne delimo i ne prodajemo tvoje podatke.',
  },

  /** `(onboarding)/welcome.tsx` — prvi ekran bez naloga. */
  welcome: {
    /** Ispod imena; dva razmaka sa obe strane tacke su namerna. */
    podnaslov: 'Est. 2004  ·  Belgrade',
    napraviNalog: 'Napravi nalog',
    vecImamNalog: 'Već imam nalog',
  },

  /** `(onboarding)/date.tsx` */
  datum: {
    naslov: 'Datum rođenja',
    /** Dugme dok tockic nije pomeren. */
    izaberi: 'Izaberi datum',
  },

  /** `(onboarding)/time.tsx` */
  vreme: {
    naslov: 'Vreme rođenja',
    izaberi: 'Izaberi vreme',
    neZnam: 'Ne znam vreme',
  },

  /** `(onboarding)/place.tsx` */
  mesto: {
    naslov: 'Mesto rođenja',
  },

  /** Pretraga grada — `place.tsx` i `components/polje-mesto.tsx`. */
  pretragaGrada: {
    placeholder: 'Grad',
    /** Dok stizu gradovi sa servera. */
    trazimDalje: 'Tražim dalje…',
  },

  /** `(onboarding)/reveal.tsx` — velika trojka posle podataka o rodjenju. */
  reveal: {
    neMozemo: 'Ne možemo da izračunamo kartu',
    zonaNepouzdana: (grad: string, zona: string) =>
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mestu ${grad} na taj datum. Probaj drugo mesto rođenja, ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Nazad na mesto rođenja',
    greskaCuvanja: 'Karta nije sačuvana — nismo uspeli da stignemo do servera. Proveri internet pa pritisni Nastavi ponovo.',
    izvorPozicija: 'Pozicije računamo iz podataka o kretanju planeta, za tvoj tačan trenutak i mesto rođenja.',
    /** Opis slike planete za citac ekrana. */
    vladajucaPlaneta: (planeta: string) => `Vladajuća planeta: ${planeta}`,
    /** Bez vremena rodjenja: vladar Suncevog znaka. */
    vladarZnaka: (planeta: string) => `Vladar tvog znaka: ${planeta}`,
    vladarKarte: (planeta: string) => `Vladar tvoje karte: ${planeta}`,
    /** Natpisi ispod tri znaka. */
    sunce: 'Sunce',
    mesec: 'Mesec',
    podznak: 'Podznak',
    /** Citac ekrana: "Sunce: Lav"; bez vremena rodjenja podznak je `nepoznat`. */
    uloga: (uloga: string, znak: string) => `${uloga}: ${znak}`,
    nepoznat: 'nepoznat',
    bezVremena: 'Bez vremena rođenja ascendent se ne može izračunati. Dopunićeš ga kasnije u profilu.',
  },

  /** `(onboarding)/account.tsx` — email (i lozinka u rezimu `password`). */
  nalogEmail: {
    naslovKod: 'Koji ti je email?',
    naslovLozinka: 'Napravi nalog',
    podnaslovKod: 'Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, i email ne delimo ni sa kim.',
    podnaslovLozinka: 'Nalog čuva tvoju kartu kad promeniš telefon. Email ne delimo ni sa kim.',
    posaljiKod: 'Pošalji mi kod',
    placeholderEmail: 'Email adresa',
    placeholderLozinka: 'Lozinka (bar 6 znakova)',
    emailZauzet: 'Ovaj email već ima nalog. Unesi drugi.',
    nijePodesen: 'Nalog još nije podešen.',
    robot: 'Nismo uspeli da potvrdimo da nisi robot. Proveri internet pa probaj ponovo.',
    previsePokusaja: 'Previše pokušaja. Sačekaj minut pa probaj ponovo.',
    kodNijePoslat: 'Nismo uspeli da pošaljemo kod. Proveri email i internet.',
    lozinkaNetacna: 'Nalog sa ovim emailom postoji, ali lozinka nije tačna.',
    lozinkaKratka: 'Lozinka mora imati bar 6 znakova.',
    nalogNijeNapravljen: 'Nismo uspeli da napravimo nalog. Proveri podatke i internet.',
    /** Samo za razvoj (rezim `password` uz ukljucenu potvrdu u Supabase-u). */
    potvrdaUkljucena: 'Potvrda emaila je uključena u Supabase-u. Isključi je u Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: 'Nismo uspeli da učitamo nalog. Proveri internet pa probaj ponovo.',
    drustvenaPrijava: 'Prijava preko Apple i Google naloga uključuje se kad napravimo dev build.',
  },

  /** `components/prijava-dugme.tsx` */
  prijavaDugme: {
    apple: 'Nastavi uz Apple',
    google: 'Nastavi uz Google',
  },

  /** `(onboarding)/code.tsx` — kod sa mejla. */
  kod: {
    naslov: 'Unesi kod',
    /** Podnaslov: `poslatPre` + email (podebljan) + `poslatPosle`. */
    poslatPre: 'Poslali smo šestocifreni kod na\n',
    poslatPosle: '.',
    potvrdi: 'Potvrdi',
    noviPoslat: 'Novi kod je poslat.',
    posaljiNovi: 'Pošalji novi kod',
    netacan: 'Kod nije tačan ili više ne važi. Upiši kod iz najnovijeg mejla ili pošalji novi.',
    nalogNijeUcitan: 'Kod je potvrđen, ali nalog nije učitan. Proveri internet pa pritisni Potvrdi ponovo.',
    robot: 'Nismo uspeli da potvrdimo da nisi robot. Probaj ponovo.',
    sacekaj: 'Sačekaj minut pre nego što tražiš novi kod.',
    /** "Napravi nalog" sa emailom koji vec ima kartu (pravilo 14). */
    zauzetNaslov: 'Ovaj email već ima nalog',
    /** Podnaslov: `pre` + email (podebljan) + `posle`. */
    zauzetPodnaslov: (datum: string, grad: string) => ({
      pre: 'Na nalogu ',
      posle: ` je karta za ${datum}, ${grad}. Za nov nalog unesi drugi email.`,
    }),
    zauzetNapomena: 'Ako uđeš u postojeći nalog, podaci iz prethodnih koraka se ne čuvaju.',
    unesiDrugi: 'Unesi drugi email',
    udjiUTaj: 'Uđi u taj nalog',
  },

  /** `components/polje-za-kod.tsx` — citac ekrana. */
  poljeZaKod: 'Šestocifreni kod',

  /** `components/turnstile.tsx` i `turnstile.web.tsx` — kad Cloudflare trazi coveka. */
  captcha: 'Samo da potvrdimo da nisi robot.',

  /** `(onboarding)/name.tsx` */
  ime: {
    naslov: 'Kako da te zovemo?',
    podnaslov: 'Tako ti se horoskop obraća direktno, umesto kao oglasna tabla.',
    placeholder: 'Tvoje ime',
  },

  /** `lib/signup.ts` — privremeno ime kad iz emaila ne ostane nista (menja se na koraku sa imenom). */
  podrazumevanoIme: 'Ti',

  /** `components/bez-interneta.tsx` — traka na vrhu sadrzaja. */
  bezInterneta: 'Nema interneta. Prikazano je ono što je sačuvano na telefonu.',

  /** `app/email.tsx` — promena emaila. */
  promenaEmaila: {
    naslov: 'Promena emaila',
    sadasnja: (stari: string) => `Sadašnja adresa je ${stari}. Na novu šaljemo kod, pa se prijavljuješ njome.`,
    placeholder: 'Nova email adresa',
    upisiKod: (adresa: string) => `Upiši kod koji smo poslali na ${adresa}.`,
    stariKod: (stari: string) => `Još jedan korak: upiši kod koji smo poslali na staru adresu, ${stari}.`,
    potrebanInternet: 'Za promenu emaila potreban je internet.',
    posaljiKod: 'Pošalji kod',
    potvrdi: 'Potvrdi',
    promeniAdresu: 'Promeni adresu ili pošalji kod ponovo',
    zauzeta: 'Ova adresa već ima nalog. Upiši drugu.',
    upravoPoslat: 'Kod je upravo poslat. Sačekaj minut pa probaj ponovo.',
    netacan: 'Kod nije tačan ili je istekao. Proveri ga, ili zatraži nov.',
    nemaVeze: 'Nema veze sa serverom. Probaj kad se internet vrati.',
    /** `razvoj` = poruka servera u zagradi, samo u razvoju; inace prazno. */
    nijeUspela: (razvoj: string) => `Promena nije uspela. Probaj ponovo za minut.${razvoj}`,
  },

  /** `app/nalog.tsx` — list "Nalog" sa profila. */
  nalog: {
    naslov: 'Nalog',
    imeIPrijava: 'Ime i prijava',
    ime: 'Ime',
    email: 'Email',
    nacinPrijave: 'Način prijave',
    /** Po `app_metadata.provider` iz Supabase-a; nepoznat provajder se pise kako stigne. */
    nacin: {
      email: 'Kod na email',
      apple: 'Apple nalog',
      google: 'Google nalog',
    } as Record<string, string>,
    nalogOd: 'Nalog od',
    podaciORodjenju: 'Podaci o rođenju',
    datumRodjenja: 'Datum rođenja',
    vremeRodjenja: 'Vreme rođenja',
    /** Vrednost reda kad vreme rodjenja nije uneto. */
    neZnam: 'Ne znam',
    mestoRodjenja: 'Mesto rođenja',
    /** Pominje natpis reda `vremeRodjenja`, pod navodnicima. */
    bezVremena: 'Bez vremena rođenja podznak i kuće nisu pouzdani. Dodirni „Vreme rođenja“ da ga dodaš.',
    odjavaSvuda: 'Odjavi se sa svih uređaja',
    odjavaNaslov: 'Odjaviti se sa svih uređaja?',
    odjavaTekst: 'Bićeš odjavljen i na ovom telefonu i na svakom drugom uređaju na kom si prijavljen.',
    odustani: 'Odustani',
    odjaviSeSvuda: 'Odjavi se svuda',
    brisanjeNaslov: 'Brisanje naloga',
    brisanjeTekst: 'Trajno briše nalog, podatke o rođenju, sliku i pitanja astrologu. Pretplata se ne otkazuje sama.',
    obrisiNalog: 'Obriši nalog',
    obrisatiNaslov: 'Obrisati nalog?',
    obrisatiTekst:
      'Briše se nalog, ime, slika i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
      'Pretplata se ovim NE otkazuje — nju otkazuješ u podešavanjima Apple ili Google naloga.',
    nijeUspelo: 'Nije uspelo',
    nijeObrisan: 'Nalog nije obrisan. Proveri internet pa probaj ponovo.',
  },

  /** `(onboarding)/push.tsx` — ukljucivanje obavestenja. */
  push: {
    naslov: 'Da ne propustiš svoj dan',
    podnaslov: 'Jednom ujutru, sa horoskopom za taj dan, i kad ti astrolog odgovori. Ništa drugo ti ne šaljemo.',
    podnaslovWeb: 'Notifikacije rade na telefonu; na vebu ovaj korak preskačemo.',
    ukljuci: 'Uključi obaveštenja',
    /** Tri primera obavestenja na ilustraciji telefona. */
    primerDanNaslov: 'Tvoj dan',
    primerDanTekst: 'Horoskop za danas je spreman.',
    primerOdgovorTekst: 'Odgovorio je na tvoje pitanje.',
    sada: 'sada',
    preSat: '1 h',
    juce: 'juče',
  },
};
