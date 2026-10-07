import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Koraci onboardinga, prijava i racun (bosanski) — vidi `sr/onboarding.ts`. Jedan objekat po ekranu, redom kao u toku. */
export const onboarding: Recnik['onboarding'] = {
  korak: {
    odustani: 'Odustani',
    /** Podrazumijevana recenica iznad dugmeta. */
    privatnost: 'Ovo koristimo da izračunamo tvoju natalnu kartu. Tvoje podatke ne dijelimo i ne prodajemo.',
  },

  welcome: {
    /** Ispod imena; dva razmaka sa obje strane tacke su namjerna. */
    podnaslov: 'Est. 2004  ·  Belgrade',
    izracunajKartu: 'Izračunaj moju kartu',
    obecanje: 'Horoskop koji piše pravi astrolog, a ne algoritam.',
    vecImamNalog: 'Već imam račun',
  },

  datum: {
    naslov: 'Datum rođenja',
    /** Dugme dok tockic nije pomjeren. */
    izaberi: 'Izaberi datum',
  },

  vreme: {
    naslov: 'Vrijeme rođenja',
    izaberi: 'Izaberi vrijeme',
    neZnam: 'Ne znam vrijeme',
  },

  mesto: {
    naslov: 'Mjesto rođenja',
  },

  pretragaGrada: {
    placeholder: 'Grad',
    /** Dok stizu gradovi sa servera. */
    trazimDalje: 'Tražim dalje…',
  },

  reveal: {
    neMozemo: 'Ne možemo izračunati kartu',
    zonaNepouzdana: (grad, zona) =>
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Probaj drugo mjesto rođenja ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Nazad na mjesto rođenja',
    greskaCuvanja: 'Karta nije sačuvana — nismo uspjeli doći do servera. Provjeri internet pa ponovo pritisni Nastavi.',
    izvorPozicija: 'Pozicije računamo iz podataka o kretanju planeta, za tvoj tačan trenutak i mjesto rođenja.',
    astrologOpisuje: 'Kako astrolog opisuje tvoju kartu',
    sacuvajKartu: 'Sačuvaj moju kartu',
    zasNalog: 'Račun čuva kartu i kad promijeniš telefon.',
    /** Opis slike planete za citac ekrana. */
    vladajucaPlaneta: (planeta) => `Vladajuća planeta: ${planeta}`,
    vladarZnaka: (planeta) => `Vladar tvog znaka: ${planeta}`,
    vladarKarte: (planeta) => `Vladar tvoje karte: ${planeta}`,
    sunce: 'Sunce',
    mesec: 'Mjesec',
    podznak: 'Podznak',
    uloga: (uloga, znak) => `${uloga}: ${znak}`,
    nepoznat: 'nepoznat',
    bezVremena: 'Bez vremena rođenja ascendent se ne može izračunati. Dopunit ćeš ga kasnije u profilu.',
  },

  nalogEmail: {
    naslovKod: 'Koji ti je e-mail?',
    naslovLozinka: 'Napravi račun',
    podnaslovKod: 'Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, a e-mail ne dijelimo ni sa kim.',
    podnaslovLozinka: 'Račun čuva tvoju kartu kad promijeniš telefon. E-mail ne dijelimo ni sa kim.',
    posaljiKod: 'Pošalji mi kod',
    placeholderEmail: 'E-mail adresa',
    placeholderLozinka: 'Lozinka (bar 6 znakova)',
    emailZauzet: 'Ovaj e-mail već ima račun. Unesi drugi.',
    nijePodesen: 'Račun još nije podešen.',
    robot: 'Nismo uspjeli potvrditi da nisi robot. Provjeri internet pa probaj ponovo.',
    previsePokusaja: 'Previše pokušaja. Sačekaj minut pa probaj ponovo.',
    kodNijePoslat: 'Nismo uspjeli poslati kod. Provjeri e-mail i internet.',
    lozinkaNetacna: 'Račun sa ovim e-mailom postoji, ali lozinka nije tačna.',
    lozinkaKratka: 'Lozinka mora imati bar 6 znakova.',
    nalogNijeNapravljen: 'Nismo uspjeli napraviti račun. Provjeri podatke i internet.',
    /** Samo za razvoj. */
    potvrdaUkljucena: 'Potvrda e-maila je uključena u Supabaseu. Isključi je u Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: 'Nismo uspjeli učitati račun. Provjeri internet pa probaj ponovo.',
    drustvenaPrijava: 'Prijava preko Apple i Google računa uključuje se kad napravimo dev build.',
  },

  prijavaDugme: {
    apple: 'Nastavi uz Apple',
    google: 'Nastavi uz Google',
  },

  kod: {
    naslov: 'Unesi kod',
    /** Podnaslov: `poslatPre` + e-mail (podebljan) + `poslatPosle`. */
    poslatPre: 'Poslali smo šestocifreni kod na\n',
    poslatPosle: '.',
    potvrdi: 'Potvrdi',
    noviPoslat: 'Novi kod je poslan.',
    posaljiNovi: 'Pošalji novi kod',
    netacan: 'Kod nije tačan ili više ne važi. Upiši kod iz najnovijeg e-maila ili pošalji novi.',
    nalogNijeUcitan: 'Kod je potvrđen, ali račun nije učitan. Provjeri internet pa ponovo pritisni Potvrdi.',
    robot: 'Nismo uspjeli potvrditi da nisi robot. Probaj ponovo.',
    sacekaj: 'Sačekaj minut prije nego što tražiš novi kod.',
    /** "Napravi racun" sa e-mailom koji vec ima kartu (pravilo 14). */
    zauzetNaslov: 'Ovaj e-mail već ima račun',
    zauzetPodnaslov: (datum, grad) => ({
      pre: 'Na računu ',
      posle: ` je karta za ${datum}, ${grad}. Za novi račun unesi drugi e-mail.`,
    }),
    zauzetNapomena: 'Ako uđeš u postojeći račun, podaci iz prethodnih koraka se ne čuvaju.',
    unesiDrugi: 'Unesi drugi e-mail',
    udjiUTaj: 'Uđi u taj račun',
  },

  /** Citac ekrana. */
  poljeZaKod: 'Šestocifreni kod',

  captcha: 'Samo da potvrdimo da nisi robot.',

  ime: {
    naslov: 'Kako da te zovemo?',
    podnaslov: 'Tako ti se horoskop obraća direktno, a ne kao oglasna tabla.',
    placeholder: 'Tvoje ime',
  },

  /** Privremeno ime kad iz e-maila ne ostane nista. */
  podrazumevanoIme: 'Ti',

  bezInterneta: 'Nema interneta. Prikazano je ono što je sačuvano na telefonu.',

  promenaEmaila: {
    naslov: 'Promjena e-maila',
    sadasnja: (stari) => `Sadašnja adresa je ${stari}. Na novu šaljemo kod, pa se prijavljuješ njome.`,
    placeholder: 'Nova e-mail adresa',
    upisiKod: (adresa) => `Upiši kod koji smo poslali na ${adresa}.`,
    stariKod: (stari) => `Još jedan korak: upiši kod koji smo poslali na staru adresu, ${stari}.`,
    potrebanInternet: 'Za promjenu e-maila potreban je internet.',
    posaljiKod: 'Pošalji kod',
    potvrdi: 'Potvrdi',
    promeniAdresu: 'Promijeni adresu ili pošalji kod ponovo',
    zauzeta: 'Ova adresa već ima račun. Upiši drugu.',
    upravoPoslat: 'Kod je upravo poslan. Sačekaj minut pa probaj ponovo.',
    netacan: 'Kod nije tačan ili je istekao. Provjeri ga ili zatraži novi.',
    nemaVeze: 'Nema veze sa serverom. Probaj kad se internet vrati.',
    /** `razvoj` = poruka servera u zagradi, samo u razvoju; inace prazno. */
    nijeUspela: (razvoj) => `Promjena nije uspjela. Probaj ponovo za minut.${razvoj}`,
  },

  nalog: {
    naslov: 'Račun',
    imeIPrijava: 'Ime i prijava',
    ime: 'Ime',
    email: 'E-mail',
    nacinPrijave: 'Način prijave',
    nacin: {
      email: 'Kod na e-mail',
      apple: 'Apple račun',
      google: 'Google račun',
    } as Record<string, string>,
    /** Natpis reda; vrijednost je datum. */
    nalogOd: 'Račun od',
    podaciORodjenju: 'Podaci o rođenju',
    datumRodjenja: 'Datum rođenja',
    vremeRodjenja: 'Vrijeme rođenja',
    neZnam: 'Ne znam',
    mestoRodjenja: 'Mjesto rođenja',
    /** Pominje natpis reda `vremeRodjenja`, pod navodnicima. */
    bezVremena: 'Dok vrijeme rođenja nije uneseno, podznak i kuće nisu pouzdani. Dodirni „Vrijeme rođenja“ da ga dodaš.',
    odjavaSvuda: 'Odjavi se sa svih uređaja',
    odjavaNaslov: 'Odjaviti se sa svih uređaja?',
    odjavaTekst: 'Bit ćeš odjavljen i na ovom telefonu i na svakom drugom uređaju na kojem si prijavljen.',
    odustani: 'Odustani',
    odjaviSeSvuda: 'Odjavi se svuda',
    brisanjeNaslov: 'Brisanje računa',
    brisanjeTekst: 'Trajno briše račun, podatke o rođenju, sliku i pitanja astrologu. Pretplata se ne otkazuje sama.',
    obrisiNalog: 'Obriši račun',
    obrisatiNaslov: 'Obrisati račun?',
    obrisatiTekst:
      'Briše se račun, ime, slika i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
      'Pretplata se ovim NE otkazuje — nju otkazuješ u postavkama Apple ili Google računa.',
    nijeUspelo: 'Nije uspjelo',
    nijeObrisan: 'Račun nije obrisan. Provjeri internet pa probaj ponovo.',
  },

  push: {
    naslov: 'Da ne propustiš svoj dan',
    podnaslov: 'Jednom ujutro, sa horoskopom za taj dan, i kad ti astrolog odgovori. Ništa drugo ti ne šaljemo.',
    podnaslovWeb: 'Obavještenja rade na telefonu; na webu ovaj korak preskačemo.',
    ukljuci: 'Uključi obavještenja',
    /** Tri primjera obavjestenja na ilustraciji telefona. */
    primerDanNaslov: 'Tvoj dan',
    primerDanTekst: 'Horoskop za danas je spreman.',
    /** "Venera je u trigonu sa tvojim Suncem." — padezi iz `nebo`. */
    primerAspektTekst: (tranzitna, aspekt, natalna) => {
      const n = nebo.padeziTela[natalna];
      return `${nebo.tela[tranzitna]} je u ${nebo.padeziAspekta[aspekt].lokativ} sa ${n.rod === 'z' ? 'tvojom' : 'tvojim'} ${n.instrumental}.`;
    },
    primerOdgovorTekst: 'Odgovorio je na tvoje pitanje.',
    sada: 'sada',
    preSat: '1 h',
    juce: 'jučer',
  },
};
