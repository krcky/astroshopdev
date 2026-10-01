import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Koraci onboardinga, prijava i racun (hrvatski) — vidi `sr/onboarding.ts`. Jedan objekt po ekranu, redom kao u toku. */
export const onboarding: Recnik['onboarding'] = {
  korak: {
    odustani: 'Odustani',
    /** Podrazumijevana recenica iznad gumba. */
    privatnost: 'Ovo koristimo za izračun tvoje natalne karte. Tvoje podatke ne dijelimo i ne prodajemo.',
  },

  welcome: {
    /** Ispod imena; dva razmaka sa obje strane tocke su namjerna. */
    podnaslov: 'Est. 2004  ·  Belgrade',
    napraviNalog: 'Izradi račun',
    vecImamNalog: 'Već imam račun',
  },

  datum: {
    naslov: 'Datum rođenja',
    /** Gumb dok kotacic nije pomaknut. */
    izaberi: 'Odaberi datum',
  },

  vreme: {
    naslov: 'Vrijeme rođenja',
    izaberi: 'Odaberi vrijeme',
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
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Pokušaj s drugim mjestom rođenja ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Natrag na mjesto rođenja',
    greskaCuvanja: 'Karta nije spremljena — nismo uspjeli doći do servera. Provjeri internet pa ponovno pritisni Nastavi.',
    izvorPozicija: 'Položaje računamo iz podataka o kretanju planeta, za tvoj točan trenutak i mjesto rođenja.',
    /** Opis slike planeta za citac zaslona. */
    vladajucaPlaneta: (planeta) => `Vladajući planet: ${planeta}`,
    vladarZnaka: (planeta) => `Vladar tvog znaka: ${planeta}`,
    vladarKarte: (planeta) => `Vladar tvoje karte: ${planeta}`,
    sunce: 'Sunce',
    mesec: 'Mjesec',
    podznak: 'Podznak',
    uloga: (uloga, znak) => `${uloga}: ${znak}`,
    nepoznat: 'nepoznat',
    bezVremena: 'Ako ne znaš vrijeme rođenja, ascendent se ne može izračunati. Možeš ga dodati poslije u profilu.',
  },

  nalogEmail: {
    naslovKod: 'Koji je tvoj e-mail?',
    naslovLozinka: 'Izradi račun',
    podnaslovKod: 'Šaljemo ti kod za prijavu. Bez lozinke, bez reklama, a e-mail ne dijelimo ni s kim.',
    podnaslovLozinka: 'Račun čuva tvoju kartu kad promijeniš mobitel. E-mail ne dijelimo ni s kim.',
    posaljiKod: 'Pošalji mi kod',
    placeholderEmail: 'E-mail adresa',
    placeholderLozinka: 'Lozinka (najmanje 6 znakova)',
    emailZauzet: 'Ovaj e-mail već ima račun. Unesi drugi.',
    nijePodesen: 'Račun još nije postavljen.',
    robot: 'Nismo uspjeli potvrditi da nisi robot. Provjeri internet pa pokušaj ponovno.',
    previsePokusaja: 'Previše pokušaja. Pričekaj minutu pa pokušaj ponovno.',
    kodNijePoslat: 'Nismo uspjeli poslati kod. Provjeri e-mail i internet.',
    lozinkaNetacna: 'Račun s ovim e-mailom postoji, ali lozinka nije točna.',
    lozinkaKratka: 'Lozinka mora imati najmanje 6 znakova.',
    nalogNijeNapravljen: 'Nismo uspjeli izraditi račun. Provjeri podatke i internet.',
    /** Samo za razvoj. */
    potvrdaUkljucena: 'Potvrda e-maila je uključena u Supabaseu. Isključi je u Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: 'Nismo uspjeli učitati račun. Provjeri internet pa pokušaj ponovno.',
    drustvenaPrijava: 'Prijava putem Apple i Google računa uključit će se kad napravimo dev build.',
  },

  prijavaDugme: {
    apple: 'Nastavi s Appleom',
    google: 'Nastavi s Googleom',
  },

  kod: {
    naslov: 'Unesi kod',
    /** Podnaslov: `poslatPre` + e-mail (podebljan) + `poslatPosle`. */
    poslatPre: 'Poslali smo kod od šest znamenki na\n',
    poslatPosle: '.',
    potvrdi: 'Potvrdi',
    noviPoslat: 'Novi kod je poslan.',
    posaljiNovi: 'Pošalji novi kod',
    netacan: 'Kod nije točan ili više ne vrijedi. Upiši kod iz najnovijeg e-maila ili pošalji novi.',
    nalogNijeUcitan: 'Kod je potvrđen, ali račun nije učitan. Provjeri internet pa ponovno pritisni Potvrdi.',
    robot: 'Nismo uspjeli potvrditi da nisi robot. Pokušaj ponovno.',
    sacekaj: 'Pričekaj minutu prije nego što zatražiš novi kod.',
    /** "Izradi racun" s e-mailom koji vec ima kartu (pravilo 14). */
    zauzetNaslov: 'Ovaj e-mail već ima račun',
    zauzetPodnaslov: (datum, grad) => ({
      pre: 'Na računu ',
      posle: ` je karta za ${datum}, ${grad}. Za novi račun unesi drugi e-mail.`,
    }),
    zauzetNapomena: 'Ako uđeš u postojeći račun, podaci iz prethodnih koraka neće se spremiti.',
    unesiDrugi: 'Unesi drugi e-mail',
    udjiUTaj: 'Uđi u taj račun',
  },

  /** Citac zaslona. */
  poljeZaKod: 'Kod od šest znamenki',

  captcha: 'Samo da potvrdimo da nisi robot.',

  ime: {
    naslov: 'Kako da te zovemo?',
    podnaslov: 'Tako ti se horoskop obraća izravno, a ne kao oglasna ploča.',
    placeholder: 'Tvoje ime',
  },

  /** Privremeno ime kad iz e-maila ne ostane nista. */
  podrazumevanoIme: 'Ti',

  bezInterneta: 'Nema interneta. Prikazano je ono što je spremljeno na mobitelu.',

  promenaEmaila: {
    naslov: 'Promjena e-maila',
    sadasnja: (stari) => `Trenutačna adresa je ${stari}. Na novu šaljemo kod, a zatim se prijavljuješ njome.`,
    placeholder: 'Nova e-mail adresa',
    upisiKod: (adresa) => `Upiši kod koji smo poslali na ${adresa}.`,
    stariKod: (stari) => `Još jedan korak: upiši kod koji smo poslali na staru adresu, ${stari}.`,
    potrebanInternet: 'Za promjenu e-maila potreban je internet.',
    posaljiKod: 'Pošalji kod',
    potvrdi: 'Potvrdi',
    promeniAdresu: 'Promijeni adresu ili ponovno pošalji kod',
    zauzeta: 'Ova adresa već ima račun. Upiši drugu.',
    upravoPoslat: 'Kod je upravo poslan. Pričekaj minutu pa pokušaj ponovno.',
    netacan: 'Kod nije točan ili je istekao. Provjeri ga ili zatraži novi.',
    nemaVeze: 'Nema veze sa serverom. Pokušaj kad se internet vrati.',
    /** `razvoj` = poruka servera u zagradi, samo u razvoju; inace prazno. */
    nijeUspela: (razvoj) => `Promjena nije uspjela. Pokušaj ponovno za minutu.${razvoj}`,
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
    /** Spominje natpis reda `vremeRodjenja`, pod navodnicima. */
    bezVremena: 'Dok vrijeme rođenja nije uneseno, podznak i kuće nisu pouzdani. Dodirni „Vrijeme rođenja“ da ga dodaš.',
    odjavaSvuda: 'Odjavi se sa svih uređaja',
    odjavaNaslov: 'Odjaviti se sa svih uređaja?',
    odjavaTekst: 'Bit ćeš odjavljen i na ovom mobitelu i na svakom drugom uređaju na kojem si prijavljen.',
    odustani: 'Odustani',
    odjaviSeSvuda: 'Odjavi se svugdje',
    brisanjeNaslov: 'Brisanje računa',
    brisanjeTekst: 'Trajno briše račun, podatke o rođenju, sliku i pitanja astrologu. Pretplata se ne otkazuje sama.',
    obrisiNalog: 'Izbriši račun',
    obrisatiNaslov: 'Izbrisati račun?',
    obrisatiTekst:
      'Briše se račun, ime, slika i svi podaci o rođenju. Ovo se ne može poništiti.\n\n' +
      'Pretplata se time NE otkazuje — nju otkazuješ u postavkama Apple ili Google računa.',
    nijeUspelo: 'Nije uspjelo',
    nijeObrisan: 'Račun nije izbrisan. Provjeri internet pa pokušaj ponovno.',
  },

  push: {
    naslov: 'Da ne propustiš svoj dan',
    podnaslov: 'Jednom ujutro, s horoskopom za taj dan, i kad ti astrolog odgovori. Ništa drugo ti ne šaljemo.',
    podnaslovWeb: 'Obavijesti rade na mobitelu; na webu ovaj korak preskačemo.',
    ukljuci: 'Uključi obavijesti',
    /** Tri primjera obavijesti na ilustraciji mobitela. */
    primerDanNaslov: 'Tvoj dan',
    primerDanTekst: 'Horoskop za danas je spreman.',
    /** "Venera je u trigonu s tvojim Suncem." — padezi iz `nebo`. */
    primerAspektTekst: (tranzitna, aspekt, natalna) => {
      const n = nebo.padeziTela[natalna];
      return `${nebo.tela[tranzitna]} je u ${nebo.padeziAspekta[aspekt].lokativ} s ${n.rod === 'z' ? 'tvojom' : 'tvojim'} ${n.instrumental}.`;
    },
    primerOdgovorTekst: 'Odgovorio je na tvoje pitanje.',
    sada: 'sada',
    preSat: '1 h',
    juce: 'jučer',
  },
};
