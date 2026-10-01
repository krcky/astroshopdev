import type { Recnik } from '../sr';
import { nebo } from './nebo';

/** Koraci onboardinga, prijava i racun (slovenski) — vidi `sr/onboarding.ts`. Jedan objekat po ekranu, redom kao u toku. */
export const onboarding: Recnik['onboarding'] = {
  korak: {
    odustani: 'Prekliči',
    /** Podrazumevana recenica iznad dugmeta. */
    privatnost: 'S temi podatki izračunamo tvojo rojstno karto. Tvojih podatkov ne delimo in ne prodajamo.',
  },

  welcome: {
    /** Ispod imena; dva razmaka sa obe strane tacke su namerna. */
    podnaslov: 'Est. 2004  ·  Belgrade',
    napraviNalog: 'Ustvari račun',
    vecImamNalog: 'Račun že imam',
  },

  datum: {
    naslov: 'Datum rojstva',
    izaberi: 'Izberi datum',
  },

  vreme: {
    naslov: 'Ura rojstva',
    izaberi: 'Izberi uro',
    neZnam: 'Ure ne vem',
  },

  mesto: {
    naslov: 'Kraj rojstva',
  },

  pretragaGrada: {
    placeholder: 'Mesto',
    trazimDalje: 'Iščem naprej …',
  },

  reveal: {
    neMozemo: 'Karte ne moremo izračunati',
    zonaNepouzdana: (grad, zona) =>
      `Ne vemo zanesljivo, koliko je bila ura po UTC v kraju ${grad} na ta datum. Poskusi z drugim krajem rojstva ali nam sporoči — časovni pas: ${zona}`,
    nazadNaMesto: 'Nazaj na kraj rojstva',
    greskaCuvanja: 'Karta ni shranjena — do strežnika nismo prišli. Preveri internet in znova pritisni Nadaljuj.',
    izvorPozicija: 'Položaje izračunamo iz podatkov o gibanju planetov, za tvoj točen trenutek in kraj rojstva.',
    vladajucaPlaneta: (planeta) => `Vladajoči planet: ${planeta}`,
    vladarZnaka: (planeta) => `Vladar tvojega znamenja: ${planeta}`,
    vladarKarte: (planeta) => `Vladar tvoje karte: ${planeta}`,
    sunce: 'Sonce',
    mesec: 'Luna',
    podznak: 'Ascendent',
    uloga: (uloga, znak) => `${uloga}: ${znak}`,
    nepoznat: 'neznan',
    bezVremena: 'Brez ure rojstva ascendenta ni mogoče izračunati. Dodaš jo lahko pozneje v profilu.',
  },

  nalogEmail: {
    naslovKod: 'Kateri je tvoj e-poštni naslov?',
    naslovLozinka: 'Ustvari račun',
    podnaslovKod: 'Poslali ti bomo kodo za prijavo. Brez gesla, brez oglasov, naslova pa ne delimo z nikomer.',
    podnaslovLozinka: 'Račun hrani tvojo karto, ko zamenjaš telefon. Naslova ne delimo z nikomer.',
    posaljiKod: 'Pošlji mi kodo',
    placeholderEmail: 'E-poštni naslov',
    placeholderLozinka: 'Geslo (vsaj 6 znakov)',
    emailZauzet: 'Ta naslov že ima račun. Vnesi drugega.',
    nijePodesen: 'Račun še ni nastavljen.',
    robot: 'Nismo mogli potrditi, da nisi robot. Preveri internet in poskusi znova.',
    previsePokusaja: 'Preveč poskusov. Počakaj minuto in poskusi znova.',
    kodNijePoslat: 'Kode nismo mogli poslati. Preveri e-poštni naslov in internet.',
    lozinkaNetacna: 'Račun s tem naslovom obstaja, geslo pa ni pravilno.',
    lozinkaKratka: 'Geslo mora imeti vsaj 6 znakov.',
    nalogNijeNapravljen: 'Računa nismo mogli ustvariti. Preveri podatke in internet.',
    potvrdaUkljucena: 'Potrditev e-pošte je vklopljena v Supabase. Izklopi jo v Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: 'Računa nismo mogli naložiti. Preveri internet in poskusi znova.',
    drustvenaPrijava: 'Prijava z računom Apple in Google bo na voljo, ko naredimo dev build.',
  },

  prijavaDugme: {
    apple: 'Nadaljuj z Apple',
    google: 'Nadaljuj z Google',
  },

  kod: {
    naslov: 'Vnesi kodo',
    poslatPre: 'Šestmestno kodo smo poslali na\n',
    poslatPosle: '.',
    potvrdi: 'Potrdi',
    noviPoslat: 'Nova koda je poslana.',
    posaljiNovi: 'Pošlji novo kodo',
    netacan: 'Koda ni pravilna ali ne velja več. Vpiši kodo iz najnovejšega sporočila ali pošlji novo.',
    nalogNijeUcitan: 'Koda je potrjena, računa pa nismo naložili. Preveri internet in znova pritisni Potrdi.',
    robot: 'Nismo mogli potrditi, da nisi robot. Poskusi znova.',
    sacekaj: 'Počakaj minuto, preden zahtevaš novo kodo.',
    zauzetNaslov: 'Ta naslov že ima račun',
    zauzetPodnaslov: (datum, grad) => ({
      pre: 'V računu ',
      posle: ` je karta za ${datum}, ${grad}. Za nov račun vnesi drug naslov.`,
    }),
    zauzetNapomena: 'Če vstopiš v obstoječi račun, se podatki iz prejšnjih korakov ne shranijo.',
    unesiDrugi: 'Vnesi drug naslov',
    udjiUTaj: 'Vstopi v ta račun',
  },

  poljeZaKod: 'Šestmestna koda',

  captcha: 'Samo da potrdimo, da nisi robot.',

  ime: {
    naslov: 'Kako naj te kličemo?',
    podnaslov: 'Tako te horoskop nagovori neposredno, ne kot oglasna deska.',
    placeholder: 'Tvoje ime',
  },

  podrazumevanoIme: 'Ti',

  bezInterneta: 'Ni interneta. Prikazano je to, kar je shranjeno v telefonu.',

  promenaEmaila: {
    naslov: 'Sprememba e-pošte',
    sadasnja: (stari) => `Trenutni naslov je ${stari}. Na novega pošljemo kodo, nato se prijavljaš z njim.`,
    placeholder: 'Nov e-poštni naslov',
    upisiKod: (adresa) => `Vpiši kodo, ki smo jo poslali na ${adresa}.`,
    stariKod: (stari) => `Še en korak: vpiši kodo, ki smo jo poslali na stari naslov, ${stari}.`,
    potrebanInternet: 'Za spremembo e-pošte potrebuješ internet.',
    posaljiKod: 'Pošlji kodo',
    potvrdi: 'Potrdi',
    promeniAdresu: 'Spremeni naslov ali znova pošlji kodo',
    zauzeta: 'Ta naslov že ima račun. Vpiši drugega.',
    upravoPoslat: 'Koda je bila pravkar poslana. Počakaj minuto in poskusi znova.',
    netacan: 'Koda ni pravilna ali je potekla. Preveri jo ali zahtevaj novo.',
    nemaVeze: 'Ni povezave s strežnikom. Poskusi, ko bo internet spet na voljo.',
    nijeUspela: (razvoj) => `Sprememba ni uspela. Poskusi znova čez minuto.${razvoj}`,
  },

  nalog: {
    naslov: 'Račun',
    imeIPrijava: 'Ime in prijava',
    ime: 'Ime',
    email: 'E-pošta',
    nacinPrijave: 'Način prijave',
    nacin: {
      email: 'Koda po e-pošti',
      apple: 'Račun Apple',
      google: 'Račun Google',
    } as Record<string, string>,
    nalogOd: 'Račun od',
    podaciORodjenju: 'Rojstni podatki',
    datumRodjenja: 'Datum rojstva',
    vremeRodjenja: 'Ura rojstva',
    neZnam: 'Ne vem',
    mestoRodjenja: 'Kraj rojstva',
    /** Pominje natpis reda `vremeRodjenja`, pod navodnicima. */
    bezVremena: 'Brez ure rojstva ascendent in hiše niso zanesljivi. Tapni „Ura rojstva“, da jo dodaš.',
    odjavaSvuda: 'Odjavi se iz vseh naprav',
    odjavaNaslov: 'Se odjaviš iz vseh naprav?',
    odjavaTekst: 'Odjavljen boš v tem telefonu in v vseh drugih napravah, v katerih si prijavljen.',
    odustani: 'Prekliči',
    odjaviSeSvuda: 'Odjavi se povsod',
    brisanjeNaslov: 'Izbris računa',
    brisanjeTekst: 'Trajno izbriše račun, rojstne podatke, sliko in vprašanja astrologu. Naročnina se ne prekliče sama.',
    obrisiNalog: 'Izbriši račun',
    obrisatiNaslov: 'Izbrišeš račun?',
    obrisatiTekst:
      'Izbrišejo se račun, ime, slika in vsi rojstni podatki. Tega ni mogoče razveljaviti.\n\n' +
      'Naročnina se s tem NE prekliče — prekličeš jo v nastavitvah računa Apple ali Google.',
    nijeUspelo: 'Ni uspelo',
    nijeObrisan: 'Račun ni izbrisan. Preveri internet in poskusi znova.',
  },

  push: {
    naslov: 'Da ne zamudiš svojega dne',
    podnaslov: 'Enkrat zjutraj, s horoskopom za ta dan, in ko ti astrolog odgovori. Ničesar drugega ti ne pošiljamo.',
    podnaslovWeb: 'Obvestila delujejo v telefonu; na spletu ta korak preskočimo.',
    ukljuci: 'Vklopi obvestila',
    primerDanNaslov: 'Tvoj dan',
    primerDanTekst: 'Horoskop za danes je pripravljen.',
    /** "Venera je v trigonu s tvojim Soncem." — pred "tvoj-" je vedno "s" (zveneci t). */
    primerAspektTekst: (tranzitna, aspekt, natalna) => {
      const n = nebo.padeziTela[natalna];
      return `${nebo.tela[tranzitna]} je v ${nebo.padeziAspekta[aspekt].lokativ} s ${n.rod === 'z' ? 'tvojo' : 'tvojim'} ${n.instrumental}.`;
    },
    primerOdgovorTekst: 'Odgovoril je na tvoje vprašanje.',
    sada: 'zdaj',
    preSat: '1 h',
    juce: 'včeraj',
  },
};
