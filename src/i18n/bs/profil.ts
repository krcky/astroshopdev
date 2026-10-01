import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';

/** "10 osoba", "2 osobe" — GENITIV uz "do" ("do 10 osoba"). */
const osobaGen = (n: number) => `${n} ${mnozina(n, ['osobe', 'osobe', 'osoba'])}`;

/** Recenica "ko vidi podatke" — ista u izmjeni osobe i u pregledu nove osobe. */
const vidisSamoTi = (astrolog: string) =>
  `Ove podatke vidiš samo ti. Ako postaviš pitanje o ovoj osobi, vidi ih i ${astrolog}.`;

/** Prijevod `sr/profil.ts` (bosanski): profil, Premium (paywall, lokoti) i druge osobe. */
export const profil: Recnik['profil'] = {
  profil: {
    dodajSliku: 'Dodaj sliku profila',
    promeniSliku: 'Promijeni ili ukloni sliku profila',
    slikaProfila: 'Slika profila',
    izaberiDruguSliku: 'Izaberi drugu sliku',
    ukloniSliku: 'Ukloni sliku',
    odustani: 'Odustani',
    nemaPristupaNaslov: 'Nema pristupa fotografijama',
    nemaPristupaTekst: 'Dozvoli pristup u postavkama telefona, pa pokušaj ponovo.',
    slikaNijeSacuvanaNaslov: 'Slika nije sačuvana',
    slikaNijeSacuvanaTekst: 'Provjeri internet, pa pokušaj ponovo.',
    pretplata: 'Pretplata',
    test: 'Test',
    nalog: 'Račun',
    pravila: 'Pravila',
    pomoc: 'Pomoć',
    pisiteNam: 'Pišite nam',
    obavestenja: 'Obavještenja',
    obavestenjaUskoro: 'Uskoro',
    nemaMejlAplikacije: (adresa) => `Na telefonu nema aplikacije za e-mail. Adresa je ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'Uključen test prekidačem',
    poklon: (istice) => `Poklon${istice ? `, do ${istice}` : ''}`,
    aktivanObnavljaSe: (istice) => `Aktivan, obnavlja se ${istice}`,
    aktivan: 'Aktivan',
    upravljajPretplatom: 'Upravljaj pretplatom',
    otkljucajPremium: 'Otključaj Premium',
    otkljucajPremiumIspod: 'Svi tranziti, cijeli tekst i drugi dani',
    vratiKupovine: 'Vrati kupovine',
    josNijeMoguceNaslov: 'Još nije moguće',
    josNijeMoguceTekst: 'Kupovina u aplikaciji još nije uključena.',
    nemaPretplateNaslov: 'Nema pretplate',
    nemaPretplateTekst: 'Na ovom računu prodavnice nema pretplate za Astro Shop.',
    proveraNijeUspelaNaslov: 'Provjera nije uspjela',
    proveraNijeUspelaTekst: 'Pokušaj ponovo za koji trenutak.',
    placeniKorisnik: 'Plaćeni korisnik',
    pratiServer: (placen) => `Prati server (${placen ? 'plaćen' : 'besplatan'})`,
    rucno: 'Ručno, samo na ovom telefonu',
    prekidacOpis: 'Test prekidač: plaćeni korisnik',
    vratiNaServer: 'Vrati na stanje sa servera',
    jezik: 'Jezik',
    jezikIspod: 'Tekstovi astrologa su za sada samo na srpskom.',
    nalogIspod: 'E-mail i podaci o rođenju',
    odjaviSe: 'Odjavi se',
    pravilaPrivatnosti: 'Pravila privatnosti',
    usloviKoriscenja: 'Uslovi korištenja',
    verzija: (ime, verzija) => `${ime} ${verzija}`,
  },

  dugmeProfil: 'Profil',

  premium: {
    naslov: 'Otvori sva tumačenja',
    podnaslov: 'Svi tvoji tranziti, teme perioda i pogled na sutra i prekosutra.',
    natalnaNaslov: 'Natalna karta',
    natalnaTekst: 'Tumačenje svake planete po znaku i kući i svih aspekata.',
    tranzitiNaslov: 'Tranziti',
    tranzitiTekst: 'Svi tranziti dana sa cijelim tumačenjem — i za sutra i prekosutra.',
    ljudiNaslov: 'Tvoji ljudi',
    ljudiTekst: (n) => `Karte i tranziti do ${n} ${mnozina(n, ['bliske osobe', 'bliske osobe', 'bliskih osoba'])}.`,
    godisnjeNaslov: 'Godišnje',
    godisnje: 'godišnje',
    mesecnoNaslov: 'Mjesečno',
    mesecno: 'mjesečno',
    poMesecu: (cena) => `${cena} mjesečno`,
    ustedi: (procenat) => `Uštedi ${procenat}%`,
    nijeUkljucena: 'Kupovina u aplikaciji još nije uključena.',
    kupovinaNijeUspela: 'Kupovina nije uspjela. Pokušaj ponovo za koji trenutak.',
    kupovinaCeka: 'Kupovina čeka odobrenje. Premium se uključuje čim stigne.',
    nemaPretplate: 'Na ovom računu prodavnice nema pretplate za Astro Shop.',
    proveraNijeUspela: 'Provjera nije uspjela. Pokušaj ponovo za koji trenutak.',
    probaj: (dana) => `Probaj ${gramatika.dana(dana)} besplatno`,
    pretplatiSe: 'Pretplati se',
    besplatno: (dana) => `${gramatika.dana(dana)} besplatno`,
    cenaPeriod: (cena, period) => `${cena} ${period}`,
    umesto: (cena) => `umjesto ${cena}`,
    obnavljanje: (proba, ios) =>
      (proba ? `Nakon probnog perioda ${proba.cena} ${proba.godisnje ? 'godišnje' : 'mjesečno'}. ` : '')
      + `Pretplata se obnavlja sama dok je ne otkažeš u postavkama ${ios ? 'App Store-a' : 'Google Play-a'}.`,
    pitanjaPosebno: 'Pitanja astrologu se plaćaju posebno.',
    uslovi: 'Uslovi',
    vratiKupovine: 'Vrati kupovine',
    privatnost: 'Privatnost',
    pisteAstrologNaslov: 'Piše astrolog',
    pisteAstrologTekst: (astrolog) => `Sva tumačenja piše astrolog ${astrolog}.`,
  },

  zakljucano: {
    red: (naslov) => `${naslov}. Uz Premium`,
  },

  tvojiLjudi: {
    naslov: 'Tvoji ljudi',
    /** Razmaci oko tačke su NEPRELOMNI. */
    naslovSaBrojem: (n) => `Tvoji ljudi  ·  ${n}`,
    redOsobe: (ime, ispod, zakljucana) =>
      `${ime}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. Uz Premium' : ''}`,
    dodajOsobu: 'Dodaj osobu',
    dodajOsobuOpis: (ispod) => `Dodaj osobu${ispod ? `. ${ispod}` : ''}`,
    uzPremiumDo: (n) => `Uz Premium do ${osobaGen(n)}`,
    praznoIspod: 'Karta i tranziti partnera, djeteta ili prijatelja',
  },

  odnosi: {
    partner: 'Partner',
    dete: 'Dijete',
    roditelj: 'Roditelj',
    brat_sestra: 'Brat ili sestra',
    prijatelj: 'Prijatelj',
    drugo: 'Neko drugi',
  },

  greske: {
    granica: 'Za još osoba potreban je Premium.',
    prijavaIstekla: 'Prijava je istekla. Zatvori aplikaciju i otvori je ponovo.',
    mreza: 'Nema veze sa serverom. Ništa nije sačuvano — probaj kad se internet vrati.',
    opsta: 'Nije sačuvano. Probaj ponovo za minut.',
  },

  rodjenje: {
    ime: 'Ime',
    koTiJeNaslov: 'Ko ti je',
    koTiJe: (ime) => `Ko ti je ${ime}?`,
    datum: 'Datum rođenja',
    vreme: 'Vrijeme rođenja',
    mesto: 'Mjesto rođenja',
    neZnamVreme: 'Ne znam vrijeme',
    imeIliNadimak: 'Ime ili nadimak',
    nemaVise: 'Ova osoba više nije na tvojoj listi.',
  },

  osoba: {
    naslov: 'Osoba',
    tabKarta: 'Natalna karta',
    tabTranziti: 'Tranziti',
    tabPitaj: 'Pitaj',
    uzPremium: (ime) => `${ime} je uz Premium`,
    uzPremiumOpis: (n) =>
      `Bez Premiuma je otvorena samo prva osoba na listi. Uz njega imaš karte i tranzite za do ${osobaGen(n)}.`,
    otkljucajSve: 'Otključaj sve osobe',
    tranzitiNeMogu: 'Tranziti ne mogu da se izračunaju',
    tranzitiNeMoguTekst: (grad) =>
      `Za mjesto ${grad} na taj datum ne znamo pouzdano koliko je sati bilo po UTC-u, pa ni karta ni tranziti na nju ne bi bili tačni.`,
    izmeniOpis: 'Izmijeni podatke o rođenju',
    pitajAstrologa: 'Pitaj astrologa',
    pitajTekst: (astrolog) => `${astrolog} vidi ovu kartu, pa možeš da pitaš o ovoj osobi ili o vama dvoma.`,
    postaviPitanje: 'Postavi pitanje',
  },

  osobaUredi: {
    naslov: 'Izmjena',
    obrisatiNaslov: 'Obrisati osobu?',
    obrisatiTekst: (ime) =>
      `${ime} nestaje sa tvoje liste, na svim uređajima. Već postavljena pitanja o ovoj osobi ostaju.`,
    odustani: 'Odustani',
    nijeIzabrano: 'Nije izabrano',
    neZnaSe: 'Ne zna se',
    napomena: (astrolog, bezVremena) =>
      (bezVremena ? 'Kad vrijeme rođenja nije poznato, karta nema podznak ni kuće. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Obriši osobu',
  },

  rodjenjePolje: {
    trebaInternet: 'Za izmjenu je potreban internet.',
    tvojeIme: 'Tvoje ime',
    vremeNijeUneto: 'Vrijeme nije uneseno — karta nema podznak ni kuće.',
    znamVreme: 'Znam vrijeme, hoću da ga unesem',
  },

  novaOsoba: {
    napomena: 'Podatke o rođenju vidiš samo ti. Ne dijelimo ih i ne prodajemo.',
    imeNaslov: 'Kako se zove?',
    imePodnaslov: 'Ime ili nadimak — vidiš ga samo ti.',
    izaberiDatum: 'Izaberi datum',
    izaberiVreme: 'Izaberi vrijeme',
    vremePodnaslov: 'Ako ne znaš vrijeme, karta nema podznak ni kuće.',
    neMozemoKartu: 'Ne možemo izračunati kartu',
    neMozemoKartuTekst: (grad, zona) =>
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Probaj drugo mjesto rođenja ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Nazad na mjesto rođenja',
    datumUVreme: (datum, vreme) => `${datum} u ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'Za dodavanje osobe potreban je internet.',
    dodajOsobu: 'Dodaj osobu',
    potvrdiPristanak: 'Potvrdi pristanak',
    sunce: 'Sunce',
    mesec: 'Mjesec',
    podznak: 'Podznak',
    ulogaZnak: (uloga, znak) => `${uloga}: ${znak ?? 'nepoznat'}`,
    bezVremena: 'Kad vrijeme rođenja nije poznato, podznak i kuće ne mogu da se izračunaju. Vrijeme možeš dodati kasnije.',
    pristanak: 'Osoba zna da unosim njene podatke o rođenju. Ako je dijete, ja sam roditelj ili staratelj.',
  },
};
