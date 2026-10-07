/**
 * Profil, Premium (paywall i zakljucano) i druge osobe ("Tvoji ljudi", strana osobe,
 * unos korak po korak, izmena jednog podatka o rodjenju). Jedan objekat po ekranu.
 */
import { gramatika, mnozina } from './gramatika';

/** "10 osoba", "2 osobe", "1 osobe" — GENITIV uz "do" ("do 10 osoba"). */
const osobaGen = (n: number) => `${n} ${mnozina(n, ['osobe', 'osobe', 'osoba'])}`;

/** Recenica "ko vidi podatke" — ista u izmeni osobe i u pregledu nove osobe. */
const vidisSamoTi = (astrolog: string) =>
  `Ove podatke vidiš samo ti. Ako postaviš pitanje o ovoj osobi, vidi ih i ${astrolog}.`;

export const profil = {
  /** `app/profile.tsx` — list profila. */
  profil: {
    dodajSliku: 'Dodaj sliku profila',
    promeniSliku: 'Promeni ili ukloni sliku profila',
    slikaProfila: 'Slika profila',
    izaberiDruguSliku: 'Izaberi drugu sliku',
    ukloniSliku: 'Ukloni sliku',
    odustani: 'Odustani',
    nemaPristupaNaslov: 'Nema pristupa fotografijama',
    nemaPristupaTekst: 'Dozvoli pristup u podešavanjima telefona, pa probaj ponovo.',
    slikaNijeSacuvanaNaslov: 'Slika nije sačuvana',
    slikaNijeSacuvanaTekst: 'Proveri internet pa probaj ponovo.',
    /** Naslovi sekcija (crtaju se verzalom). */
    pretplata: 'Pretplata',
    test: 'Test',
    nalog: 'Nalog',
    pravila: 'Pravila',
    /** Pomoc: mejl podrsci. */
    pomoc: 'Pomoć',
    pisiteNam: 'Pišite nam',
    obavestenja: 'Obaveštenja',
    obavestenjaUskoro: 'Uskoro',
    nemaMejlAplikacije: (adresa: string) => `Na telefonu nema aplikacije za mejl. Adresa je ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'Uključen test prekidačem',
    /** `istice` je datum ("Uto, 29. sep 2026") ili null. */
    poklon: (istice: string | null) => `Poklon${istice ? `, do ${istice}` : ''}`,
    aktivanObnavljaSe: (istice: string) => `Aktivan, obnavlja se ${istice}`,
    aktivan: 'Aktivan',
    upravljajPretplatom: 'Upravljaj pretplatom',
    otkljucajPremium: 'Otključaj Premium',
    otkljucajPremiumIspod: 'Ceo tekst dana, sutra i natalna karta',
    vratiKupovine: 'Vrati kupovine',
    josNijeMoguceNaslov: 'Još nije moguće',
    josNijeMoguceTekst: 'Kupovina u aplikaciji još nije uključena.',
    nemaPretplateNaslov: 'Nema pretplate',
    nemaPretplateTekst: 'Na ovom nalogu prodavnice nema pretplate za Astro Shop.',
    proveraNijeUspelaNaslov: 'Provera nije uspela',
    proveraNijeUspelaTekst: 'Pokušaj ponovo za koji trenutak.',
    /** Test prekidac — samo u probnom buildu. */
    placeniKorisnik: 'Plaćeni korisnik',
    pratiServer: (placen: boolean) => `Prati server (${placen ? 'plaćen' : 'besplatan'})`,
    rucno: 'Ručno, samo na ovom telefonu',
    prekidacOpis: 'Test prekidač: plaćeni korisnik',
    vratiNaServer: 'Vrati na stanje sa servera',
    /** Izbor jezika (za sada samo u probnom buildu — tekstovi astrologa su jos samo na srpskom). */
    jezik: 'Jezik',
    jezikIspod: 'Tekstovi astrologa su za sada samo na srpskom.',
    nalogIspod: 'Email i podaci o rođenju',
    odjaviSe: 'Odjavi se',
    pravilaPrivatnosti: 'Pravila privatnosti',
    usloviKoriscenja: 'Uslovi korišćenja',
    /** "Astro Shop 1.0.0" na dnu. */
    verzija: (ime: string, verzija: string) => `${ime} ${verzija}`,
  },

  /** `components/profile-button.tsx` — dugme gore desno. */
  dugmeProfil: 'Profil',

  /** `app/premium.tsx` — paywall. */
  premium: {
    naslov: 'Cela slika tvog dana',
    podnaslov: 'Ceo dnevni tekst, sutra i prekosutra, i cela tvoja karta.',
    natalnaNaslov: 'Natalna karta',
    natalnaTekst: 'Svaka planeta po znaku i kući, i veze među njima.',
    tranzitiNaslov: 'Ceo tekst dana',
    tranzitiTekst: 'Šta se dešava, na šta da paziš i šta da probaš. Za danas, sutra i prekosutra.',
    ljudiNaslov: 'Tvoji ljudi',
    ljudiTekst: (n: number) => `Karta i dnevni tekstovi za partnera, dete ili prijatelja. Do ${n} osoba.`,
    /** Naslov kartice paketa (veliko slovo) i period uz cenu (malo). */
    godisnjeNaslov: 'Godišnje',
    godisnje: 'godišnje',
    mesecnoNaslov: 'Mesečno',
    mesecno: 'mesečno',
    /** "4,16 € mesečno" ispod godisnje cene. */
    poMesecu: (cena: string) => `${cena} mesečno`,
    ustedi: (procenat: number) => `Uštedi ${procenat}%`,
    nijeUkljucena: 'Kupovina u aplikaciji još nije uključena.',
    kupovinaNijeUspela: 'Kupovina nije uspela. Pokušaj ponovo za koji trenutak.',
    kupovinaCeka: 'Kupovina čeka odobrenje. Premium se uključuje čim stigne.',
    nemaPretplate: 'Na ovom nalogu prodavnice nema pretplate za Astro Shop.',
    proveraNijeUspela: 'Provera nije uspela. Pokušaj ponovo za koji trenutak.',
    probaj: (dana: number) => `Probaj ${gramatika.dana(dana)} besplatno`,
    pretplatiSe: 'Pretplati se',
    /** "7 dana besplatno" na kartici paketa. */
    besplatno: (dana: number) => `${gramatika.dana(dana)} besplatno`,
    /** "49,99 € godišnje" — za citac ekrana. */
    cenaPeriod: (cena: string, period: string) => `${cena} ${period}`,
    /** Precrtana puna cena — za citac ekrana. */
    umesto: (cena: string) => `umesto ${cena}`,
    /**
     * Recenica o obnavljanju ispod dugmeta (Apple). `proba` = cena i period posle probe,
     * null kad paket nema probu; `ios` bira ime prodavnice.
     */
    obnavljanje: (proba: { cena: string; godisnje: boolean } | null, ios: boolean) =>
      (proba ? `Posle probe ${proba.cena} ${proba.godisnje ? 'godišnje' : 'mesečno'}. ` : '')
      + `Pretplata se obnavlja sama dok je ne otkažeš u podešavanjima ${ios ? 'App Store-a' : 'Google Play-a'}.`,
    /** Posle recenice o obnavljanju: da Premium ne izgleda kao da ukljucuje i pitanje astrologu. */
    pitanjaPosebno: 'Pitanja astrologu se plaćaju posebno.',
    uslovi: 'Uslovi',
    vratiKupovine: 'Vrati kupovine',
    privatnost: 'Privatnost',
    /** Stavka "ko pise" (B7 iz UX recenzije). */
    pisteAstrologNaslov: 'Piše astrolog',
    pisteAstrologTekst: (astrolog: string) => `Sva tumačenja piše astrolog ${astrolog}.`,
  },

  /** `components/zakljucano.tsx` — katanci i kartica "Otključaj". */
  zakljucano: {
    /** Citac ekrana za zakljucan red. */
    red: (naslov: string) => `${naslov}. Uz Premium`,
  },

  /** `components/tvoji-ljudi.tsx` — druge osobe na profilu. */
  tvojiLjudi: {
    naslov: 'Tvoji ljudi',
    /** Naslov sa brojem osoba; razmaci su NEPRELOMNI. */
    naslovSaBrojem: (n: number) => `Tvoji ljudi  ·  ${n}`,
    /** Citac ekrana za red osobe: ime, pa odnos i znak, pa katanac. */
    redOsobe: (ime: string, ispod: string, zakljucana: boolean) =>
      `${ime}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. Uz Premium' : ''}`,
    dodajOsobu: 'Dodaj osobu',
    dodajOsobuOpis: (ispod: string | null) => `Dodaj osobu${ispod ? `. ${ispod}` : ''}`,
    uzPremiumDo: (n: number) => `Uz Premium do ${osobaGen(n)}`,
    praznoIspod: 'Karta i tranziti partnera, deteta ili prijatelja',
  },

  /** `lib/osobe.ts` — "Ko ti je"; kljucevi su u bazi. Naziv bez roda, pol ne pitamo. */
  odnosi: {
    partner: 'Partner',
    dete: 'Dete',
    roditelj: 'Roditelj',
    brat_sestra: 'Brat ili sestra',
    prijatelj: 'Prijatelj',
    drugo: 'Neko drugi',
  },

  /** `lib/osobe.ts` (`porukaOsobe`) — greska servera ili mreze pri upisu osobe. */
  greske: {
    granica: 'Za još osoba potreban je Premium.',
    prijavaIstekla: 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.',
    mreza: 'Nema veze sa serverom. Ništa nije sačuvano — probaj kad se internet vrati.',
    opsta: 'Nije sačuvano. Probaj ponovo za minut.',
  },

  /** Podaci o rodjenju — zajednicki natpisi tabele, lista jednog podatka i koraka nove osobe. */
  rodjenje: {
    ime: 'Ime',
    koTiJeNaslov: 'Ko ti je',
    /** Ime u nominativu, kako je uneto ("Ko ti je Ana?"). */
    koTiJe: (ime: string) => `Ko ti je ${ime}?`,
    datum: 'Datum rođenja',
    vreme: 'Vreme rođenja',
    mesto: 'Mesto rođenja',
    neZnamVreme: 'Ne znam vreme',
    imeIliNadimak: 'Ime ili nadimak',
    nemaVise: 'Ova osoba više nije na tvojoj listi.',
  },

  /** `app/osoba.tsx` — strana druge osobe. */
  osoba: {
    naslov: 'Osoba',
    tabKarta: 'Natalna karta',
    tabTranziti: 'Tranziti',
    tabPitaj: 'Pitaj',
    uzPremium: (ime: string) => `${ime} je uz Premium`,
    uzPremiumOpis: (n: number) =>
      `Bez Premium-a je otvorena samo prva osoba na listi. Uz njega imaš karte i tranzite za do ${osobaGen(n)}.`,
    otkljucajSve: 'Otključaj sve osobe',
    tranzitiNeMogu: 'Tranziti ne mogu da se izračunaju',
    tranzitiNeMoguTekst: (grad: string) =>
      `Za mesto ${grad} na taj datum ne znamo pouzdano koliko je sati bilo po UTC-u, pa ni karta ni tranziti na nju ne bi bili tačni.`,
    izmeniOpis: 'Izmeni podatke o rođenju',
    pitajAstrologa: 'Pitaj astrologa',
    /** `astrolog` = kratko ime astrologa. */
    pitajTekst: (astrolog: string) => `${astrolog} vidi ovu kartu, pa možeš da pitaš o ovoj osobi ili o vama dvoma.`,
    postaviPitanje: 'Postavi pitanje',
  },

  /** `app/osoba-uredi.tsx` — tabela podataka druge osobe. */
  osobaUredi: {
    naslov: 'Izmena',
    obrisatiNaslov: 'Obrisati osobu?',
    obrisatiTekst: (ime: string) =>
      `${ime} nestaje sa tvoje liste, na svim uređajima. Već postavljena pitanja o ovoj osobi ostaju.`,
    odustani: 'Odustani',
    nijeIzabrano: 'Nije izabrano',
    neZnaSe: 'Ne zna se',
    /** Napomena ispod tabele; `bezVremena` dodaje recenicu o podznaku i kucama. */
    napomena: (astrolog: string, bezVremena: boolean) =>
      (bezVremena ? 'Bez vremena rođenja karta nema podznak ni kuće. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Obriši osobu',
  },

  /** `app/rodjenje-polje.tsx` — list sa jednim podatkom o rodjenju. */
  rodjenjePolje: {
    trebaInternet: 'Za izmenu je potreban internet.',
    tvojeIme: 'Tvoje ime',
    vremeNijeUneto: 'Vreme nije uneto — karta nema podznak ni kuće.',
    znamVreme: 'Znam vreme, hoću da ga unesem',
  },

  /** `app/nova-osoba/*` — nova osoba korak po korak. */
  novaOsoba: {
    /** Napomena ispod koraka (umesto "tvoju kartu" iz onboardinga). */
    napomena: 'Podatke o rođenju vidiš samo ti. Ne delimo ih i ne prodajemo.',
    imeNaslov: 'Kako se zove?',
    imePodnaslov: 'Ime ili nadimak — vidiš ga samo ti.',
    izaberiDatum: 'Izaberi datum',
    izaberiVreme: 'Izaberi vreme',
    vremePodnaslov: 'Bez vremena karta nema podznak ni kuće.',
    /** Pregled. */
    neMozemoKartu: 'Ne možemo da izračunamo kartu',
    neMozemoKartuTekst: (grad: string, zona: string) =>
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mestu ${grad} na taj datum. Probaj drugo mesto rođenja, ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Nazad na mesto rođenja',
    /** "12. maj 1990 u 14:30". */
    datumUVreme: (datum: string, vreme: string) => `${datum} u ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'Za dodavanje osobe potreban je internet.',
    dodajOsobu: 'Dodaj osobu',
    /** Ugaseno dugme dok pristanak nije potvrdjen — kaze sta fali. */
    potvrdiPristanak: 'Potvrdi pristanak',
    sunce: 'Sunce',
    mesec: 'Mesec',
    podznak: 'Podznak',
    /** Citac ekrana: "Sunce: Lav". */
    ulogaZnak: (uloga: string, znak: string | null) => `${uloga}: ${znak ?? 'nepoznat'}`,
    bezVremena: 'Bez vremena rođenja podznak i kuće ne mogu da se izračunaju. Vreme možeš da dodaš kasnije.',
    pristanak: 'Osoba zna da unosim njene podatke o rođenju. Ako je dete, ja sam roditelj ili staratelj.',
  },
};
