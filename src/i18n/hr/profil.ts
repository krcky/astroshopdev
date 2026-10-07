import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';

/** "10 osoba", "2 osobe" — GENITIV uz "do" ("do 10 osoba"). */
const osobaGen = (n: number) => `${n} ${mnozina(n, ['osobe', 'osobe', 'osoba'])}`;

/** Recenica "tko vidi podatke" — ista u izmjeni osobe i u pregledu nove osobe. */
const vidisSamoTi = (astrolog: string) =>
  `Ove podatke vidiš samo ti. Ako postaviš pitanje o ovoj osobi, vidi ih i ${astrolog}.`;

/** Prijevod `sr/profil.ts` (hrvatski): profil, Premium (paywall, lokoti) i druge osobe. */
export const profil: Recnik['profil'] = {
  profil: {
    dodajSliku: 'Dodaj sliku profila',
    promeniSliku: 'Promijeni ili ukloni sliku profila',
    slikaProfila: 'Slika profila',
    izaberiDruguSliku: 'Odaberi drugu sliku',
    ukloniSliku: 'Ukloni sliku',
    odustani: 'Odustani',
    nemaPristupaNaslov: 'Nema pristupa fotografijama',
    nemaPristupaTekst: 'Dopusti pristup u postavkama mobitela pa pokušaj ponovno.',
    slikaNijeSacuvanaNaslov: 'Slika nije spremljena',
    slikaNijeSacuvanaTekst: 'Provjeri internet pa pokušaj ponovno.',
    pretplata: 'Pretplata',
    test: 'Test',
    nalog: 'Račun',
    pravila: 'Pravila',
    pomoc: 'Pomoć',
    pisiteNam: 'Pišite nam',
    obavestenja: 'Obavijesti',
    obavestenjaUskoro: 'Uskoro',
    nemaMejlAplikacije: (adresa) => `Na mobitelu nema aplikacije za e-mail. Adresa je ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'Uključen testnim prekidačem',
    poklon: (istice) => `Poklon${istice ? `, do ${istice}` : ''}`,
    aktivanObnavljaSe: (istice) => `Aktivan, obnavlja se ${istice}`,
    aktivan: 'Aktivan',
    upravljajPretplatom: 'Upravljaj pretplatom',
    otkljucajPremium: 'Otključaj Premium',
    otkljucajPremiumIspod: 'Cijeli tekst dana, sutra i natalna karta',
    vratiKupovine: 'Vrati kupnje',
    josNijeMoguceNaslov: 'Još nije moguće',
    josNijeMoguceTekst: 'Kupnja u aplikaciji još nije uključena.',
    nemaPretplateNaslov: 'Nema pretplate',
    nemaPretplateTekst: 'Na ovom računu trgovine nema pretplate za Astro Shop.',
    proveraNijeUspelaNaslov: 'Provjera nije uspjela',
    proveraNijeUspelaTekst: 'Pokušaj ponovno za koji trenutak.',
    placeniKorisnik: 'Plaćeni korisnik',
    pratiServer: (placen) => `Prati server (${placen ? 'plaćen' : 'besplatan'})`,
    rucno: 'Ručno, samo na ovom mobitelu',
    prekidacOpis: 'Testni prekidač: plaćeni korisnik',
    vratiNaServer: 'Vrati na stanje sa servera',
    jezik: 'Jezik',
    jezikIspod: 'Tekstovi astrologa zasad su samo na srpskom.',
    nalogIspod: 'E-mail i podaci o rođenju',
    odjaviSe: 'Odjavi se',
    pravilaPrivatnosti: 'Pravila privatnosti',
    usloviKoriscenja: 'Uvjeti korištenja',
    verzija: (ime, verzija) => `${ime} ${verzija}`,
  },

  dugmeProfil: 'Profil',

  premium: {
    naslov: 'Cijela slika tvog dana',
    podnaslov: 'Cijeli dnevni tekst, sutra i prekosutra, i tvoja cijela karta.',
    natalnaNaslov: 'Natalna karta',
    natalnaTekst: 'Svaki planet po znaku i kući, i veze među njima.',
    tranzitiNaslov: 'Cijeli tekst dana',
    tranzitiTekst: 'Što se događa, na što da paziš i što da probaš. Za danas, sutra i prekosutra.',
    ljudiNaslov: 'Tvoji ljudi',
    ljudiTekst: (n) => `Karta i dnevni tekstovi za partnera, dijete ili prijatelja. Do ${n} osoba.`,
    godisnjeNaslov: 'Godišnje',
    godisnje: 'godišnje',
    mesecnoNaslov: 'Mjesečno',
    mesecno: 'mjesečno',
    poMesecu: (cena) => `${cena} mjesečno`,
    ustedi: (procenat) => `Uštedi ${procenat}%`,
    nijeUkljucena: 'Kupnja u aplikaciji još nije uključena.',
    kupovinaNijeUspela: 'Kupnja nije uspjela. Pokušaj ponovno za koji trenutak.',
    kupovinaCeka: 'Kupnja čeka odobrenje. Premium se uključuje čim stigne.',
    nemaPretplate: 'Na ovom računu trgovine nema pretplate za Astro Shop.',
    proveraNijeUspela: 'Provjera nije uspjela. Pokušaj ponovno za koji trenutak.',
    probaj: (dana) => `Isprobaj ${gramatika.dana(dana)} besplatno`,
    pretplatiSe: 'Pretplati se',
    besplatno: (dana) => `${gramatika.dana(dana)} besplatno`,
    cenaPeriod: (cena, period) => `${cena} ${period}`,
    umesto: (cena) => `umjesto ${cena}`,
    obnavljanje: (proba, ios) =>
      (proba ? `Nakon probnog razdoblja ${proba.cena} ${proba.godisnje ? 'godišnje' : 'mjesečno'}. ` : '')
      + `Pretplata se obnavlja sama dok je ne otkažeš u postavkama ${ios ? 'App Storea' : 'Google Playa'}.`,
    pitanjaPosebno: 'Pitanja astrologu plaćaju se posebno.',
    uslovi: 'Uvjeti',
    vratiKupovine: 'Vrati kupnje',
    privatnost: 'Privatnost',
    pisteAstrologNaslov: 'Piše astrolog',
    pisteAstrologTekst: (astrolog) => `Sva tumačenja piše astrolog ${astrolog}.`,
  },

  zakljucano: {
    red: (naslov) => `${naslov}. Uz Premium`,
  },

  tvojiLjudi: {
    naslov: 'Tvoji ljudi',
    /** Razmaci oko tocke su NEPRELOMNI. */
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
    drugo: 'Netko drugi',
  },

  greske: {
    granica: 'Za još osoba potreban je Premium.',
    prijavaIstekla: 'Prijava je istekla. Zatvori aplikaciju i ponovno je otvori.',
    mreza: 'Nema veze sa serverom. Ništa nije spremljeno — pokušaj kad se internet vrati.',
    opsta: 'Nije spremljeno. Pokušaj ponovno za minutu.',
  },

  rodjenje: {
    ime: 'Ime',
    koTiJeNaslov: 'Tko ti je',
    koTiJe: (ime) => `Tko ti je ${ime}?`,
    datum: 'Datum rođenja',
    vreme: 'Vrijeme rođenja',
    mesto: 'Mjesto rođenja',
    neZnamVreme: 'Ne znam vrijeme',
    imeIliNadimak: 'Ime ili nadimak',
    nemaVise: 'Ova osoba više nije na tvom popisu.',
  },

  osoba: {
    naslov: 'Osoba',
    tabKarta: 'Natalna karta',
    tabTranziti: 'Tranziti',
    tabPitaj: 'Pitaj',
    uzPremium: (ime) => `${ime} je uz Premium`,
    uzPremiumOpis: (n) =>
      `Bez Premiuma otvorena je samo prva osoba na popisu. Uz njega imaš karte i tranzite za najviše ${osobaGen(n)}.`,
    otkljucajSve: 'Otključaj sve osobe',
    tranzitiNeMogu: 'Tranziti se ne mogu izračunati',
    tranzitiNeMoguTekst: (grad) =>
      `Za mjesto ${grad} na taj datum ne znamo pouzdano koliko je sati bilo po UTC-u, pa ni karta ni tranziti na nju ne bi bili točni.`,
    izmeniOpis: 'Uredi podatke o rođenju',
    pitajAstrologa: 'Pitaj astrologa',
    pitajTekst: (astrolog) => `${astrolog} vidi ovu kartu, pa možeš pitati o ovoj osobi ili o vama dvoma.`,
    postaviPitanje: 'Postavi pitanje',
  },

  osobaUredi: {
    naslov: 'Uređivanje',
    obrisatiNaslov: 'Izbrisati osobu?',
    obrisatiTekst: (ime) =>
      `${ime} nestaje s tvog popisa, na svim uređajima. Već postavljena pitanja o ovoj osobi ostaju.`,
    odustani: 'Odustani',
    nijeIzabrano: 'Nije odabrano',
    neZnaSe: 'Ne zna se',
    napomena: (astrolog, bezVremena) =>
      (bezVremena ? 'Kad vrijeme rođenja nije poznato, karta nema podznak ni kuće. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Izbriši osobu',
  },

  rodjenjePolje: {
    trebaInternet: 'Za izmjenu je potreban internet.',
    tvojeIme: 'Tvoje ime',
    vremeNijeUneto: 'Vrijeme nije uneseno — karta nema podznak ni kuće.',
    znamVreme: 'Znam vrijeme, želim ga unijeti',
  },

  novaOsoba: {
    napomena: 'Podatke o rođenju vidiš samo ti. Ne dijelimo ih i ne prodajemo.',
    imeNaslov: 'Kako se zove?',
    imePodnaslov: 'Ime ili nadimak — vidiš ga samo ti.',
    izaberiDatum: 'Odaberi datum',
    izaberiVreme: 'Odaberi vrijeme',
    vremePodnaslov: 'Ako ne znaš vrijeme, karta nema podznak ni kuće.',
    neMozemoKartu: 'Ne možemo izračunati kartu',
    neMozemoKartuTekst: (grad, zona) =>
      `Ne znamo pouzdano koliko je sati bilo po UTC-u u mjestu ${grad} na taj datum. Pokušaj s drugim mjestom rođenja ili nam javi — zona: ${zona}`,
    nazadNaMesto: 'Natrag na mjesto rođenja',
    datumUVreme: (datum, vreme) => `${datum} u ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'Za dodavanje osobe potreban je internet.',
    dodajOsobu: 'Dodaj osobu',
    potvrdiPristanak: 'Potvrdi pristanak',
    sunce: 'Sunce',
    mesec: 'Mjesec',
    podznak: 'Podznak',
    ulogaZnak: (uloga, znak) => `${uloga}: ${znak ?? 'nepoznat'}`,
    bezVremena: 'Kad vrijeme rođenja nije poznato, podznak i kuće ne mogu se izračunati. Vrijeme možeš dodati kasnije.',
    pristanak: 'Osoba zna da unosim njezine podatke o rođenju. Ako je dijete, ja sam roditelj ili skrbnik.',
  },
};
