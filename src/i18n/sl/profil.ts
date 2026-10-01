import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';

/** "do 10 oseb", "do 1 osebe" — RODILNIK uz "do". */
const osobaGen = (n: number) => `${n} ${mnozina(n, ['osebe', 'oseb', 'oseb', 'oseb'])}`;

/** Stavek "kdo vidi podatke" — isti v urejanju osebe in v pregledu nove osebe. */
const vidisSamoTi = (astrolog: string) =>
  `Te podatke vidiš samo ti. Če postaviš vprašanje o tej osebi, jih vidi tudi ${astrolog}.`;

/** Prevod `sr/profil.ts` (slovenski): profil, Premium (paywall, kljucavnice) in druge osebe. */
export const profil: Recnik['profil'] = {
  profil: {
    dodajSliku: 'Dodaj profilno sliko',
    promeniSliku: 'Zamenjaj ali odstrani profilno sliko',
    slikaProfila: 'Profilna slika',
    izaberiDruguSliku: 'Izberi drugo sliko',
    ukloniSliku: 'Odstrani sliko',
    odustani: 'Prekliči',
    nemaPristupaNaslov: 'Ni dostopa do fotografij',
    nemaPristupaTekst: 'Dovoli dostop v nastavitvah telefona in poskusi znova.',
    slikaNijeSacuvanaNaslov: 'Slika ni shranjena',
    slikaNijeSacuvanaTekst: 'Preveri internetno povezavo in poskusi znova.',
    pretplata: 'Naročnina',
    test: 'Test',
    nalog: 'Račun',
    pravila: 'Pravila',
    pomoc: 'Pomoč',
    pisiteNam: 'Pišite nam',
    obavestenja: 'Obvestila',
    obavestenjaUskoro: 'Kmalu',
    nemaMejlAplikacije: (adresa) => `V telefonu ni aplikacije za e-pošto. Naslov je ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'Vklopljen s testnim stikalom',
    poklon: (istice) => `Darilo${istice ? `, do ${istice}` : ''}`,
    aktivanObnavljaSe: (istice) => `Aktiven, podaljša se ${istice}`,
    aktivan: 'Aktiven',
    upravljajPretplatom: 'Upravljaj naročnino',
    otkljucajPremium: 'Odkleni Premium',
    otkljucajPremiumIspod: 'Vsi tranziti, celotno besedilo in drugi dnevi',
    vratiKupovine: 'Obnovi nakupe',
    josNijeMoguceNaslov: 'Še ni mogoče',
    josNijeMoguceTekst: 'Nakupi v aplikaciji še niso vklopljeni.',
    nemaPretplateNaslov: 'Ni naročnine',
    nemaPretplateTekst: 'Na tem računu trgovine ni naročnine za Astro Shop.',
    proveraNijeUspelaNaslov: 'Preverjanje ni uspelo',
    proveraNijeUspelaTekst: 'Poskusi znova čez trenutek.',
    placeniKorisnik: 'Uporabnik z naročnino',
    pratiServer: (placen) => `Sledi strežniku (${placen ? 'z naročnino' : 'brezplačno'})`,
    rucno: 'Ročno, samo na tem telefonu',
    prekidacOpis: 'Testno stikalo: uporabnik z naročnino',
    vratiNaServer: 'Vrni na stanje s strežnika',
    jezik: 'Jezik',
    jezikIspod: 'Besedila astrologa so zaenkrat samo v srbščini.',
    nalogIspod: 'E-pošta in rojstni podatki',
    odjaviSe: 'Odjava',
    pravilaPrivatnosti: 'Pravilnik o zasebnosti',
    usloviKoriscenja: 'Pogoji uporabe',
    verzija: (ime, verzija) => `${ime} ${verzija}`,
  },

  dugmeProfil: 'Profil',

  premium: {
    naslov: 'Odpri vse razlage',
    podnaslov: 'Vsi tvoji tranziti, teme obdobja ter pogled na jutri in pojutrišnjem.',
    natalnaNaslov: 'Rojstna karta',
    natalnaTekst: 'Razlaga vsakega planeta po znamenju in hiši ter vseh aspektov.',
    tranzitiNaslov: 'Tranziti',
    tranzitiTekst: 'Vsi tranziti dneva s celotno razlago — tudi za jutri in pojutrišnjem.',
    ljudiNaslov: 'Tvoji ljudje',
    ljudiTekst: (n) =>
      `Karte in tranziti do ${n} ${mnozina(n, ['bližnje osebe', 'bližnjih oseb', 'bližnjih oseb', 'bližnjih oseb'])}.`,
    godisnjeNaslov: 'Letno',
    godisnje: 'letno',
    mesecnoNaslov: 'Mesečno',
    mesecno: 'mesečno',
    poMesecu: (cena) => `${cena} mesečno`,
    /** Slovenscina pise razmak pred % (neprelomni). */
    ustedi: (procenat) => `Prihrani ${procenat} %`,
    nijeUkljucena: 'Nakupi v aplikaciji še niso vklopljeni.',
    kupovinaNijeUspela: 'Nakup ni uspel. Poskusi znova čez trenutek.',
    kupovinaCeka: 'Nakup čaka na odobritev. Premium se vklopi takoj, ko ta pride.',
    nemaPretplate: 'Na tem računu trgovine ni naročnine za Astro Shop.',
    proveraNijeUspela: 'Preverjanje ni uspelo. Poskusi znova čez trenutek.',
    probaj: (dana) => `Preizkusi ${gramatika.dana(dana)} brezplačno`,
    pretplatiSe: 'Naroči se',
    besplatno: (dana) => `${gramatika.dana(dana)} brezplačno`,
    cenaPeriod: (cena, period) => `${cena} ${period}`,
    umesto: (cena) => `namesto ${cena}`,
    obnavljanje: (proba, ios) =>
      (proba ? `Po preizkusnem obdobju ${proba.cena} ${proba.godisnje ? 'letno' : 'mesečno'}. ` : '')
      + `Naročnina se samodejno podaljšuje, dokler je ne prekličeš v nastavitvah ${ios ? 'App Stora' : 'Google Playa'}.`,
    pitanjaPosebno: 'Vprašanja astrologu se plačajo posebej.',
    uslovi: 'Pogoji',
    vratiKupovine: 'Obnovi nakupe',
    privatnost: 'Zasebnost',
    pisteAstrologNaslov: 'Piše astrolog',
    pisteAstrologTekst: (astrolog) => `Vse razlage piše astrolog ${astrolog}.`,
  },

  zakljucano: {
    red: (naslov) => `${naslov}. S Premiumom`,
  },

  tvojiLjudi: {
    naslov: 'Tvoji ljudje',
    /** Razmaki okoli pike so NEPRELOMNI. */
    naslovSaBrojem: (n) => `Tvoji ljudje  ·  ${n}`,
    redOsobe: (ime, ispod, zakljucana) =>
      `${ime}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. S Premiumom' : ''}`,
    dodajOsobu: 'Dodaj osebo',
    dodajOsobuOpis: (ispod) => `Dodaj osebo${ispod ? `. ${ispod}` : ''}`,
    uzPremiumDo: (n) => `S Premiumom do ${osobaGen(n)}`,
    praznoIspod: 'Karta in tranziti partnerja, otroka ali prijatelja',
  },

  odnosi: {
    partner: 'Partner',
    dete: 'Otrok',
    roditelj: 'Starš',
    brat_sestra: 'Brat ali sestra',
    prijatelj: 'Prijatelj',
    drugo: 'Nekdo drug',
  },

  greske: {
    granica: 'Za več oseb potrebuješ Premium.',
    prijavaIstekla: 'Prijava je potekla. Zapri aplikacijo in jo znova odpri.',
    mreza: 'Ni povezave s strežnikom. Nič ni shranjeno — poskusi, ko bo internet spet na voljo.',
    opsta: 'Ni shranjeno. Poskusi znova čez minuto.',
  },

  rodjenje: {
    ime: 'Ime',
    koTiJeNaslov: 'Kdo ti je',
    koTiJe: (ime) => `Kdo ti je ${ime}?`,
    datum: 'Datum rojstva',
    vreme: 'Ura rojstva',
    mesto: 'Kraj rojstva',
    neZnamVreme: 'Ne vem ure',
    imeIliNadimak: 'Ime ali vzdevek',
    nemaVise: 'Te osebe ni več na tvojem seznamu.',
  },

  osoba: {
    naslov: 'Oseba',
    tabKarta: 'Rojstna karta',
    tabTranziti: 'Tranziti',
    tabPitaj: 'Vprašaj',
    uzPremium: (ime) => `${ime} je na voljo s Premiumom`,
    uzPremiumOpis: (n) =>
      `Brez Premiuma je odprta samo prva oseba na seznamu. Z njim imaš karte in tranzite do ${osobaGen(n)}.`,
    otkljucajSve: 'Odkleni vse osebe',
    tranzitiNeMogu: 'Tranzitov ni mogoče izračunati',
    tranzitiNeMoguTekst: (grad) =>
      `Za kraj ${grad} na ta datum ne vemo zanesljivo, koliko je bila ura po UTC, zato ne karta ne tranziti nanjo ne bi bili točni.`,
    izmeniOpis: 'Uredi rojstne podatke',
    pitajAstrologa: 'Vprašaj astrologa',
    pitajTekst: (astrolog) => `${astrolog} vidi to karto, zato lahko vprašaš o tej osebi ali o vaju dveh.`,
    postaviPitanje: 'Postavi vprašanje',
  },

  osobaUredi: {
    naslov: 'Urejanje',
    obrisatiNaslov: 'Izbrišeš osebo?',
    obrisatiTekst: (ime) =>
      `${ime} izgine s tvojega seznama na vseh napravah. Že postavljena vprašanja o tej osebi ostanejo.`,
    odustani: 'Prekliči',
    nijeIzabrano: 'Ni izbrano',
    neZnaSe: 'Ni znano',
    napomena: (astrolog, bezVremena) =>
      (bezVremena ? 'Brez ure rojstva karta nima ascendenta in hiš. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Izbriši osebo',
  },

  rodjenjePolje: {
    trebaInternet: 'Za spremembo potrebuješ internet.',
    tvojeIme: 'Tvoje ime',
    vremeNijeUneto: 'Ura ni vnesena — karta nima ascendenta in hiš.',
    znamVreme: 'Vem uro, želim jo vnesti',
  },

  novaOsoba: {
    napomena: 'Rojstne podatke vidiš samo ti. Ne delimo jih in jih ne prodajamo.',
    imeNaslov: 'Kako se imenuje?',
    imePodnaslov: 'Ime ali vzdevek — vidiš ga samo ti.',
    izaberiDatum: 'Izberi datum',
    izaberiVreme: 'Izberi uro',
    vremePodnaslov: 'Brez ure rojstva karta nima ascendenta in hiš.',
    neMozemoKartu: 'Karte ne moremo izračunati',
    neMozemoKartuTekst: (grad, zona) =>
      `Ne vemo zanesljivo, koliko je bila ura po UTC v kraju ${grad} na ta datum. Poskusi z drugim krajem rojstva ali nam sporoči — časovni pas: ${zona}`,
    nazadNaMesto: 'Nazaj na kraj rojstva',
    datumUVreme: (datum, vreme) => `${datum} ob ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'Za dodajanje osebe potrebuješ internet.',
    dodajOsobu: 'Dodaj osebo',
    potvrdiPristanak: 'Potrdi soglasje',
    sunce: 'Sonce',
    mesec: 'Luna',
    podznak: 'Ascendent',
    ulogaZnak: (uloga, znak) => `${uloga}: ${znak ?? 'neznano'}`,
    bezVremena: 'Brez ure rojstva ascendenta in hiš ni mogoče izračunati. Uro lahko dodaš pozneje.',
    pristanak: 'Oseba ve, da vnašam njene rojstne podatke. Če gre za otroka, sem starš ali skrbnik.',
  },
};
