/**
 * PRICE (pravila 23 i 25): dnevna prica, prica o znaku, kartice za deljenje, video.
 *
 * DVA LICA, NAMERNO: slika u prici se obraca korisniku ("Tvoj dan", "Ide ti", "Za tebe"), a
 * KARTICA ZA DELJENJE i VIDEO su u PRVOM LICU ("Moj dan", "Ide mi", "Za mene") — sliku
 * objavljuje korisnik. To su razlicite stavke (`dnevna` naspram `kartica`, `ti` naspram `ja`).
 *
 * BROJ RECI ODREDJUJE TRAJANJE SLIKE (`trajanjeSlike`, 0,25 s po reci) — duzi prevod = duza slika.
 */
import { mnozina } from './gramatika';

type ElementKljuc = 'vatra' | 'zemlja' | 'vazduh' | 'voda';
type KvalitetKljuc = 'kardinalan' | 'fiksni' | 'promenljiv';
type PolaritetKljuc = 'pozitivan' | 'negativan';

/** Redni broj znaka u zodijaku, od Ovna. */
const REDNI = ['Prvi', 'Drugi', 'Treći', 'Četvrti', 'Peti', 'Šesti', 'Sedmi', 'Osmi', 'Deveti', 'Deseti', 'Jedanaesti', 'Dvanaesti'];
const ELEMENT_PRIDEV: Record<ElementKljuc, string> = { vatra: 'vatreni', zemlja: 'zemljani', vazduh: 'vazdušni', voda: 'vodeni' };
const KVALITET_PRIDEV: Record<KvalitetKljuc, string> = { kardinalan: 'kardinalni', fiksni: 'fiksni', promenljiv: 'promenljivi' };
/** Doba godine (severna polulopta), od proleca: [akuzativ, genitiv] — "otvara proleće", "sredina proleća". */
const DOBA: readonly (readonly [string, string])[] = [['proleće', 'proleća'], ['leto', 'leta'], ['jesen', 'jeseni'], ['zimu', 'zime']];
/** Instrumental imena znaka: "Ovnom vlada Mars". */
const INSTRUMENTAL: Record<string, string> = {
  aries: 'Ovnom', taurus: 'Bikom', gemini: 'Blizancima', cancer: 'Rakom', leo: 'Lavom', virgo: 'Devicom',
  libra: 'Vagom', scorpio: 'Škorpijom', sagittarius: 'Strelcem', capricorn: 'Jarcem', aquarius: 'Vodolijom', pisces: 'Ribama',
};
/** Znaci cije je ime u mnozini: "Blizanci vladaju", ne "vlada". */
const MNOZINA_ZNAKA = new Set(['gemini', 'pisces']);

export const prica = {
  /** Domen — ne prevodi se. */
  sajt: 'astroshop.rs',
  /** Zaglavlje kartice za deljenje: "Sre, 30. sep 2026 · astroshop.rs", "Ovan · astroshop.rs". */
  uzSajt: (ispred: string) => `${ispred} · astroshop.rs`,
  /** Ime fajla koje korisnik vidi (meni za deljenje, Fajlovi, AirDrop), bez nastavka: "Astro Shop 2026-10-01", "Astro Shop Rak". */
  imeFajla: (sta: string) => `Astro Shop ${sta}`,
  /** Procenat: "42 %" (srpski pravopis: razmak pre znaka). */
  procenat: (n: number) => `${n} %`,

  /** `app/prica.tsx` i `components/prica/plejer.tsx` — okvir price (zaglavlje, dugmad, VoiceOver). */
  plejer: {
    zatvori: 'Zatvori priču',
    podeliVideoSePravi: (procenat: string) => `Podeli. Video se pravi, ${procenat}`,
    /** Ispod "Nastavi" na poslednjoj slici price u onboardingu. */
    novaPricaStize: 'Nova priča stiže svakog dana, na početnoj.',
    prethodnaSlika: 'Prethodna slika',
    sledecaSlika: (redni: number, od: number) => `Sledeća slika, ${redni} od ${od}`,
  },

  /** `components/prica/ulaz.tsx` — prsten i balon na pocetnoj. */
  ulaz: {
    /** Natpis balona (kratko, jedan red) i ime dugmeta. */
    pricaDana: 'Priča dana',
    hint: 'Otvara kratku priču o tvom danu',
  },

  /**
   * DNEVNA PRICA, slika u prici (`components/prica/slajdovi.tsx`) — DRUGO LICE. Stavke bez lica
   * (najvaznije danas, savet dana…) koristi i kartica za deljenje.
   */
  dnevna: {
    tvojDan: 'Tvoj dan',
    nemaAspekata: 'Danas nijedna planeta ne pravi aspekt sa tvojom kartom.',
    /** "Najvažnije danas · tačan danas" (verzal). */
    najvaznijeDanas: (momenat: string) => `Najvažnije danas · ${momenat}`,
    najboljeTiIde: 'Najbolje ti ide',
    /** Verzal, ispod imena oblasti. */
    boljeNegoJuce: '↑ bolje nego juče',
    /** VoiceOver za red ocene: "Ljubav, 4 od 5, dobro, bolje nego juče". */
    ocenaA11y: (oblast: string, ocena: number, oznaka: string, bolje: boolean) =>
      `${oblast}, ${ocena} od 5, ${oznaka}${bolje ? ', bolje nego juče' : ''}`,
    ideTi: 'Ide ti',
    kociTe: 'Koči te',
    /** "Mesec danas · Sledi: Poslednja četvrt, Sub, 3. okt" (verzal). */
    mesecDanas: (sledeca: string) => `Mesec danas · ${sledeca}`,
    zaTebe: 'Za tebe',
    /** Natpis ispod saveta: "Iz tumačenja tranzita Mars kvadrat Sunce." */
    izTumacenja: (tranzit: string) => `Iz tumačenja tranzita ${tranzit}.`,
    savetDana: 'Savet dana',
    /** Dugme na poslednjoj slici, i naslov menija za deljenje. */
    podeliSvojDan: 'Podeli svoj dan',
    procitajCeo: 'Pročitaj ceo tekst',
  },

  /** KARTICA ZA DELJENJE i kadar VIDEA dnevne price (`components/prica/kartica.tsx`) — PRVO LICE. */
  kartica: {
    mojDan: 'Moj dan',
    najboljeMiIde: 'Najbolje mi ide',
    ideMi: 'Ide mi',
    kociMe: 'Koči me',
    zaMene: 'Za mene',
  },

  /** Racun dnevne price (`lib/prica.ts`, `lib/use-prica.ts`). */
  racun: {
    /** Legenda tona tranzita: "7 skladnih", "2 mešovita", "1 napet"; spajaju se sa " · ". */
    ton: {
      povoljno: (n: number) => `${n} ${mnozina(n, ['skladan', 'skladna', 'skladnih'])}`,
      mesovito: (n: number) => `${n} ${mnozina(n, ['mešovit', 'mešovita', 'mešovitih'])}`,
      izazovno: (n: number) => `${n} ${mnozina(n, ['napet', 'napeta', 'napetih'])}`,
    },
    /** Trenutak "Tvog dana" uz "Najvažnije danas" (malim slovima). */
    momenat: {
      egzaktan: 'tačan danas',
      pocinje: 'počinje danas',
      zavrsava: 'poslednji dan',
    },
    /** Ime tranzita: "Mars kvadrat Sunce" (tranzitna planeta, aspekt, natalna tacka). */
    imeTranzita: (tranzitna: string, aspekt: string, natalna: string) => `${tranzitna} ${aspekt} ${natalna}`,
    /** Sledeca glavna faza Meseca: "Sledi: Poslednja četvrt, Sub, 3. okt". */
    sledi: (faza: string, datum: string) => `Sledi: ${faza}, ${datum}`,
  },

  /** PRICA O ZNAKU (`lib/prica-znaka.ts`, `components/prica-znaka/slike.tsx`, `app/prica-znak.tsx`). */
  znak: {
    /** Posle "Astro Shop" u zaglavlju price, i naslov videa na traci. */
    podnaslov: 'Tvoj znak',
    /** "Prvi znak zodijaka"; `i` = mesto u krugu od Ovna (0—11). */
    redni: (i: number) => `${REDNI[i]} znak zodijaka`,
    element: { vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Vazduh', voda: 'Voda' } as Record<ElementKljuc, string>,
    kvalitet: { kardinalan: 'Kardinalan', fiksni: 'Fiksni', promenljiv: 'Promenljiv' } as Record<KvalitetKljuc, string>,
    polaritet: { pozitivan: 'Pozitivan', negativan: 'Negativan' } as Record<PolaritetKljuc, string>,
    polaritetOpis: {
      pozitivan: 'kao svi vatreni i vazdušni znaci',
      negativan: 'kao svi zemljani i vodeni znaci',
    } as Record<PolaritetKljuc, string>,
    /** Naslov slike "Osnove znaka": "Vatreni, kardinalni znak". */
    osnove: (element: ElementKljuc, kvalitet: KvalitetKljuc) => {
      const p = ELEMENT_PRIDEV[element];
      return `${p[0].toUpperCase()}${p.slice(1)}, ${KVALITET_PRIDEV[kvalitet]} znak`;
    },
    /** Doba godine: `doba` 0 prolece … 3 zima, `deo` 0 otvara, 1 sredina, 2 kraj. */
    doba: (doba: number, deo: number) => {
      const [akuzativ, genitiv] = DOBA[doba];
      return [`otvara ${akuzativ}`, `sredina ${genitiv}`, `kraj ${genitiv}`][deo];
    },
    /** Srodni znaci istog elementa: "kao Lav i Strelac". */
    srodni: (imena: readonly string[]) => `kao ${imena.join(' i ')}`,
    /** "Deo tela kojim Ovan vlada" / "… kojim Blizanci vladaju". */
    teloOznaka: (znakKljuc: string, ime: string) => `Deo tela kojim ${ime} ${MNOZINA_ZNAKA.has(znakKljuc) ? 'vladaju' : 'vlada'}`,
    /** "Ovnom vlada Mars". */
    vladarNaslov: (znakKljuc: string, vladar: string) => `${INSTRUMENTAL[znakKljuc]} vlada ${vladar}`,
    /** Umesto znaka vladara, kad je vladar uvek u istom znaku (Sunce u Lavu). */
    vladarMit: { sun: 'Grci su ga zvali Helios.' } as Record<string, string>,
    /** "U tvojoj natalnoj karti Mars je u Biku." — `lokativi`: jedan znak, ili dva kad vreme rodjenja nije poznato ("u Blizancima ili Raku"). */
    /** `lice` 'ja' = kartica i video (prvo lice), 'ti' = slika u prici. */
    vladarRecenica: (vladar: string, lokativi: readonly string[], lice: 'ti' | 'ja' = 'ti') =>
      `U ${lice === 'ja' ? 'mojoj' : 'tvojoj'} natalnoj karti ${vladar} je u ${lokativi.join(' ili ')}.`,
    /** Tema tumacenja za dugme: "Sunce u Ovnu" (`uZnaku` = "u Ovnu"). */
    sunceU: (uZnaku: string) => `Sunce ${uZnaku}`,
    /** Dugme na poslednjoj slici: "Pročitaj: Sunce u Ovnu". */
    procitaj: (tema: string) => `Pročitaj: ${tema}`,
    /** Cip na naslovnoj: "Sunce na 14°". */
    sunceNa: (stepen: number) => `Sunce na ${stepen}°`,

    /** Slika 1 — natpis i naslov: `ti` u prici, `ja` na kartici za deljenje i u videu (PRVO LICE). */
    sazvezdjeOznaka: { ti: 'Tvoje sazvežđe', ja: 'Moje sazvežđe' },
    sazvezdjeNaslov: { ti: 'Po ovim zvezdama je tvoj znak dobio ime.', ja: 'Po ovim zvezdama je moj znak dobio ime.' },
    /** Slika 3: "Ovan ukratko" (verzal). */
    ukratko: (ime: string) => `${ime} ukratko`,
    najveceVrednosti: 'Najveće vrednosti',
    uLjubavi: 'U ljubavi',
    naPoslu: 'Na poslu',
    /** Slika 6: `ti` u prici, `ja` na kartici i u videu (PRVO LICE). */
    osvojitiOznaka: { ti: 'Kako te osvojiti', ja: 'Kako da me osvojiš' },
    /** Slika 7. */
    osnoveZnaka: 'Osnove znaka',
    oznakaElement: 'Element',
    oznakaKvalitet: 'Kvalitet',
    oznakaPol: 'Pol',
    oznakaPolaritet: 'Polaritet',
    oznakaIzgled: 'Izgled',
    /** Slika 8. Naslov ulazi i u trajanje slike (broj reci). */
    znakUStvarima: 'Znak u stvarima',
    stvariNaslov: 'Kamen, boja, biljka i hrana',
    dragiKamen: 'Dragi kamen',
    boja: 'Boja',
    biljka: 'Biljka',
    hrana: 'Hrana',
    zivotinja: 'Životinja',
    /** Slika 9. */
    vladarZnaka: 'Vladar znaka',
    danasNaslov: 'A šta je danas?',
    /** Dugme na poslednjoj slici, i naslov menija za deljenje. */
    podeliSvojZnak: 'Podeli svoj znak',
  },

  /** VIDEO price: posao (`components/prica/poslovi-videa.tsx`) i obavestenje (`video-radionica.tsx`). */
  posao: {
    /** Naslov videa dnevne price (traka iznad tabova). */
    naslovDana: 'Priča dana',
    /** Tekst obavestenja: "Priča dana, Sre, 1. okt 2026." */
    opisDana: (datum: string) => `Priča dana, ${datum}.`,
    /** "Priča o tvom znaku, Ovan." */
    opisZnaka: (znak: string) => `Priča o tvom znaku, ${znak}.`,
    /** Lokalno obavestenje kad je video gotov. */
    obavestenjeNaslov: 'Tvoj video je spreman',
    obavestenjeTekst: (opis: string) => `${opis} Dodirni da ga podeliš.`,
    /** Android: ime kanala obavestenja u sistemskim podesavanjima. */
    kanal: 'Video priče',
  },

  /** "Podeli" u prici: slika ili video (`components/prica/ponudi-video.tsx`). */
  ponudi: {
    upravoPravimo: (drugi: string) => `Upravo pravimo video: ${drugi}. Ovaj možeš čim taj bude gotov.`,
    sePravi: (procenat: string) => `Video se pravi · ${procenat}. Javićemo ti kad bude gotov.`,
    spreman: 'Video cele priče je spreman.',
    pravimoOkoMinut: 'Video pravimo oko minut. Za to vreme koristi aplikaciju — javićemo ti kad bude gotov.',
    ovaSlika: 'Ova slika',
    pogledajVideo: 'Pogledaj video',
    celaPrica: 'Cela priča, video',
    /** Ugaseno dugme u iOS meniju dok se video pravi. */
    sePraviDugme: (procenat: string) => `Video se pravi · ${procenat}`,
    cekaDrugi: 'Video — čeka drugi video',
  },

  /** Traka iznad tabova (`components/prica/video-traka.tsx`). */
  traka: {
    pravimo: 'Pravimo tvoj video',
    spreman: 'Tvoj video je spreman',
    nijeUspeo: 'Video nije uspeo',
    pokusajIzPrice: 'Pokušaj ponovo iz priče.',
    /** "Priča dana · 42 %" */
    uToku: (naslov: string, procenat: string) => `${naslov} · ${procenat}`,
    /** VoiceOver: naslov i podnaslov trake kao jedna recenica. */
    a11y: (naslov: string, podnaslov: string) => `${naslov}. ${podnaslov}`,
    podeliVideo: 'Podeli video',
    skloni: 'Skloni traku',
  },

  /**
   * List "Tvoj video" (`app/video-price.tsx`). `ios`: iOS mesto za slike zove "Fotografije",
   * Android "Galerija" — recenica se menja cela, padez zavisi od jezika.
   */
  video: {
    naslov: 'Tvoj video',
    pricaDana: 'Priča dana',
    pricaOZnaku: 'Priča o tvom znaku',
    podeliVideo: 'Podeli video',
    doKrajaDana: 'U aplikaciji je do kraja dana.',
    doKrajaDanaGalerija: (ios: boolean) => `U aplikaciji je do kraja dana, a u ${ios ? 'Fotografijama' : 'Galeriji'} ostaje.`,
    dokNeNapravisNov: 'U aplikaciji je dok ne napraviš nov.',
    dokNeNapravisNovGalerija: (ios: boolean) => `U aplikaciji je dok ne napraviš nov, a u ${ios ? 'Fotografijama' : 'Galeriji'} ostaje.`,
    /** "Pravimo tvoj video · 42 %" */
    pravimo: (procenat: string) => `Pravimo tvoj video · ${procenat}`,
    zaToVreme: 'Za to vreme koristi aplikaciju. Ako izađeš iz nje, pravljenje kreće ispočetka kad se vratiš.',
    nijeUspeo: (dnevni: boolean) =>
      `Video nije uspeo. Otvori ${dnevni ? 'priču dana' : 'priču o znaku'} i pokušaj ponovo: dugme „Podeli“, pa „Cela priča, video“.`,
    nemaDanas: 'Danas još nema videa. Napravićeš ga iz priče dana: dugme „Podeli“, pa „Cela priča, video“.',
    nemaZnaka: 'Video znaka još nije napravljen. Napravićeš ga iz priče o znaku (tab „Ti“): dugme „Podeli“, pa „Cela priča, video“.',
    bezDozvole: (ios: boolean) => `Astro Shop nema dozvolu da dodaje u ${ios ? 'Fotografije' : 'Galeriju'}.`,
    otvoriPodesavanja: 'Otvori Podešavanja',
    sacuvano: (ios: boolean) => `Sačuvano u ${ios ? 'Fotografijama' : 'Galeriji'}`,
    sacuvaj: (ios: boolean) => `Sačuvaj u ${ios ? 'Fotografije' : 'Galeriju'}`,
    nijeSacuvan: 'Video nije sačuvan. Pokušaj ponovo.',
    /** VoiceOver za pregled videa (isti za obe price). */
    a11yPregled: 'Video priče dana',
  },
};
