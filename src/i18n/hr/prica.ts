import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * PRICE (pravila 23 i 25), hrvatski — prijevod `sr/prica.ts`.
 *
 * DVA LICA, kao u srpskom: slika u prici je drugo lice ("Tvoj dan", "Ide ti"), kartica za dijeljenje
 * i video prvo lice ("Moj dan", "Ide mi"). BROJ RIJECI ODREDJUJE TRAJANJE SLIKE — kratko.
 * Hrvatski: "izraditi" video (ne "praviti"), "gumb", "spremi", infinitiv ("Kako me osvojiti").
 */
type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Redni broj znaka u zodijaku, od Ovna. */
const REDNI = ['Prvi', 'Drugi', 'Treći', 'Četvrti', 'Peti', 'Šesti', 'Sedmi', 'Osmi', 'Deveti', 'Deseti', 'Jedanaesti', 'Dvanaesti'];
const ELEMENT_PRIDEV = { vatra: 'vatreni', zemlja: 'zemljani', vazduh: 'zračni', voda: 'vodeni' } as const;
const KVALITET_PRIDEV = { kardinalan: 'kardinalni', fiksni: 'fiksni', promenljiv: 'promjenjivi' } as const;
/** Godisnje doba (sjeverna polutka), od proljeca: [akuzativ, genitiv] — "otvara proljeće", "sredina proljeća". */
const DOBA: readonly (readonly [string, string])[] = [['proljeće', 'proljeća'], ['ljeto', 'ljeta'], ['jesen', 'jeseni'], ['zimu', 'zime']];
/** Instrumental imena znaka: "Ovnom vlada Mars". */
const INSTRUMENTAL: Record<ZnakKljuc, string> = {
  aries: 'Ovnom', taurus: 'Bikom', gemini: 'Blizancima', cancer: 'Rakom', leo: 'Lavom', virgo: 'Djevicom',
  libra: 'Vagom', scorpio: 'Škorpionom', sagittarius: 'Strijelcem', capricorn: 'Jarcem', aquarius: 'Vodenjakom', pisces: 'Ribama',
};
/** Znakovi cije je ime u mnozini: "Blizanci vladaju", ne "vlada". */
const MNOZINA_ZNAKA = new Set(['gemini', 'pisces']);

const uFoto = (ios: boolean) => (ios ? 'Fotografijama' : 'Galeriji');
const uFotoKamo = (ios: boolean) => (ios ? 'Fotografije' : 'Galeriju');

export const prica: Recnik['prica'] = {
  /** Domena — ne prevodi se. */
  sajt: 'astroshop.rs',
  uzSajt: (ispred) => `${ispred} · astroshop.rs`,
  /** Ime datoteke ostaje "Astro Shop …". */
  imeFajla: (sta) => `Astro Shop ${sta}`,
  /** Hrvatski pravopis: razmak prije znaka postotka. */
  procenat: (n) => `${n} %`,

  plejer: {
    zatvori: 'Zatvori priču',
    podeliVideoSePravi: (procenat) => `Podijeli. Video se izrađuje, ${procenat}`,
    novaPricaStize: 'Nova priča stiže svaki dan, na početnoj.',
    prethodnaSlika: 'Prethodna slika',
    sledecaSlika: (redni, od) => `Sljedeća slika, ${redni} od ${od}`,
  },

  ulaz: {
    pricaDana: 'Priča dana',
    hint: 'Otvara kratku priču o tvom danu',
  },

  /** Slika u prici — DRUGO LICE. */
  dnevna: {
    tvojDan: 'Tvoj dan',
    nemaAspekata: 'Danas nijedan planet ne tvori aspekt s tvojom kartom.',
    najvaznijeDanas: (momenat) => `Najvažnije danas · ${momenat}`,
    najboljeTiIde: 'Najbolje ti ide',
    boljeNegoJuce: '↑ bolje nego jučer',
    ocenaA11y: (oblast, ocena, oznaka, bolje) =>
      `${oblast}, ${ocena} od 5, ${oznaka}${bolje ? ', bolje nego jučer' : ''}`,
    ideTi: 'Ide ti',
    kociTe: 'Koči te',
    mesecDanas: (sledeca) => `Mjesec danas · ${sledeca}`,
    zaTebe: 'Za tebe',
    izTumacenja: (tranzit) => `Iz tumačenja tranzita ${tranzit}.`,
    savetDana: 'Savjet dana',
    podeliSvojDan: 'Podijeli svoj dan',
    procitajCeo: 'Pročitaj cijeli tekst',
  },

  /** Kartica za dijeljenje i video — PRVO LICE. */
  kartica: {
    mojDan: 'Moj dan',
    najboljeMiIde: 'Najbolje mi ide',
    ideMi: 'Ide mi',
    kociMe: 'Koči me',
    zaMene: 'Za mene',
  },

  racun: {
    ton: {
      povoljno: (n) => `${n} ${mnozina(n, ['skladan', 'skladna', 'skladnih'])}`,
      mesovito: (n) => `${n} ${mnozina(n, ['mješovit', 'mješovita', 'mješovitih'])}`,
      izazovno: (n) => `${n} ${mnozina(n, ['napet', 'napeta', 'napetih'])}`,
    },
    momenat: {
      egzaktan: 'točan danas',
      pocinje: 'počinje danas',
      zavrsava: 'zadnji dan',
    },
    imeTranzita: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    sledi: (faza, datum) => `Slijedi: ${faza}, ${datum}`,
  },

  znak: {
    podnaslov: 'Tvoj znak',
    redni: (i) => `${REDNI[i]} znak zodijaka`,
    element: { vatra: 'Vatra', zemlja: 'Zemlja', vazduh: 'Zrak', voda: 'Voda' },
    kvalitet: { kardinalan: 'Kardinalni', fiksni: 'Fiksni', promenljiv: 'Promjenjivi' },
    polaritet: { pozitivan: 'Pozitivan', negativan: 'Negativan' },
    polaritetOpis: {
      pozitivan: 'kao svi vatreni i zračni znakovi',
      negativan: 'kao svi zemljani i vodeni znakovi',
    },
    osnove: (element, kvalitet) => {
      const p: string = ELEMENT_PRIDEV[element];
      return `${p[0].toUpperCase()}${p.slice(1)}, ${KVALITET_PRIDEV[kvalitet]} znak`;
    },
    doba: (doba, deo) => {
      const [akuzativ, genitiv] = DOBA[doba];
      return [`otvara ${akuzativ}`, `sredina ${genitiv}`, `kraj ${genitiv}`][deo];
    },
    srodni: (imena) => `kao ${imena.join(' i ')}`,
    teloOznaka: (znakKljuc, ime) => `Dio tijela kojim ${ime} ${MNOZINA_ZNAKA.has(znakKljuc) ? 'vladaju' : 'vlada'}`,
    vladarNaslov: (znakKljuc, vladar) => `${INSTRUMENTAL[znakKljuc as ZnakKljuc]} vlada ${vladar}`,
    vladarMit: { sun: 'Grci su ga zvali Helios.' },
    vladarRecenica: (vladar, lokativi, lice = 'ti') =>
      `U ${lice === 'ja' ? 'mojoj' : 'tvojoj'} natalnoj karti ${vladar} je u ${lokativi.join(' ili ')}.`,
    sunceU: (uZnaku) => `Sunce ${uZnaku}`,
    procitaj: (tema) => `Pročitaj: ${tema}`,
    sunceNa: (stepen) => `Sunce na ${stepen}°`,

    sazvezdjeOznaka: { ti: 'Tvoje zviježđe', ja: 'Moje zviježđe' },
    sazvezdjeNaslov: { ti: 'Po ovim je zvijezdama tvoj znak dobio ime.', ja: 'Po ovim je zvijezdama moj znak dobio ime.' },
    ukratko: (ime) => `${ime} ukratko`,
    najveceVrednosti: 'Najveće vrijednosti',
    uLjubavi: 'U ljubavi',
    naPoslu: 'Na poslu',
    osvojitiOznaka: { ti: 'Kako te osvojiti', ja: 'Kako me osvojiti' },
    osnoveZnaka: 'Osnove znaka',
    oznakaElement: 'Element',
    oznakaKvalitet: 'Kvaliteta',
    oznakaPol: 'Spol',
    oznakaPolaritet: 'Polaritet',
    oznakaIzgled: 'Izgled',
    znakUStvarima: 'Znak u stvarima',
    stvariNaslov: 'Kamen, boja, biljka i hrana',
    dragiKamen: 'Dragi kamen',
    boja: 'Boja',
    biljka: 'Biljka',
    hrana: 'Hrana',
    zivotinja: 'Životinja',
    vladarZnaka: 'Vladar znaka',
    danasNaslov: 'A što je danas?',
    podeliSvojZnak: 'Podijeli svoj znak',
  },

  posao: {
    naslovDana: 'Priča dana',
    /** Datum vec zavrsava tockom ("1. lis 2026.") — bez dvostruke. */
    opisDana: (datum) => `Priča dana, ${datum}${datum.endsWith('.') ? '' : '.'}`,
    opisZnaka: (znak) => `Priča o tvom znaku, ${znak}.`,
    obavestenjeNaslov: 'Tvoj video je spreman',
    obavestenjeTekst: (opis) => `${opis} Dodirni da ga podijeliš.`,
    kanal: 'Video priče',
  },

  ponudi: {
    upravoPravimo: (drugi) => `Upravo izrađujemo video: ${drugi}. Ovaj možeš čim taj bude gotov.`,
    sePravi: (procenat) => `Video se izrađuje · ${procenat}. Javit ćemo ti kad bude gotov.`,
    spreman: 'Video cijele priče je spreman.',
    pravimoOkoMinut: 'Izrada videa traje oko minutu. Za to vrijeme koristi aplikaciju — javit ćemo ti kad bude gotov.',
    ovaSlika: 'Ova slika',
    pogledajVideo: 'Pogledaj video',
    celaPrica: 'Cijela priča, video',
    sePraviDugme: (procenat) => `Video se izrađuje · ${procenat}`,
    cekaDrugi: 'Video — čeka drugi video',
  },

  traka: {
    pravimo: 'Izrađujemo tvoj video',
    spreman: 'Tvoj video je spreman',
    nijeUspeo: 'Video nije uspio',
    pokusajIzPrice: 'Pokušaj ponovno iz priče.',
    uToku: (naslov, procenat) => `${naslov} · ${procenat}`,
    a11y: (naslov, podnaslov) => `${naslov}. ${podnaslov}`,
    podeliVideo: 'Podijeli video',
    skloni: 'Makni traku',
  },

  /** "Fotografije" (iOS) i "Galerija" (Android) su imena sustavnih aplikacija. */
  video: {
    naslov: 'Tvoj video',
    pricaDana: 'Priča dana',
    pricaOZnaku: 'Priča o tvom znaku',
    podeliVideo: 'Podijeli video',
    doKrajaDana: 'U aplikaciji je do kraja dana.',
    doKrajaDanaGalerija: (ios) => `U aplikaciji je do kraja dana, a u ${uFoto(ios)} ostaje.`,
    dokNeNapravisNov: 'U aplikaciji je dok ne izradiš novi.',
    dokNeNapravisNovGalerija: (ios) => `U aplikaciji je dok ne izradiš novi, a u ${uFoto(ios)} ostaje.`,
    pravimo: (procenat) => `Izrađujemo tvoj video · ${procenat}`,
    zaToVreme: 'Za to vrijeme koristi aplikaciju. Ako izađeš iz nje, izrada kreće ispočetka kad se vratiš.',
    nijeUspeo: (dnevni) =>
      `Video nije uspio. Otvori ${dnevni ? 'priču dana' : 'priču o znaku'} i pokušaj ponovno: gumb „Podijeli“, pa „Cijela priča, video“.`,
    nemaDanas: 'Danas još nema videa. Izradit ćeš ga iz priče dana: gumb „Podijeli“, pa „Cijela priča, video“.',
    nemaZnaka: 'Video znaka još nije izrađen. Izradit ćeš ga iz priče o znaku (tab „Ti“): gumb „Podijeli“, pa „Cijela priča, video“.',
    bezDozvole: (ios) => `Astro Shop nema dopuštenje za dodavanje u ${uFotoKamo(ios)}.`,
    otvoriPodesavanja: 'Otvori Postavke',
    sacuvano: (ios) => `Spremljeno u ${uFotoKamo(ios)}`,
    sacuvaj: (ios) => `Spremi u ${uFotoKamo(ios)}`,
    nijeSacuvan: 'Video nije spremljen. Pokušaj ponovno.',
    a11yPregled: 'Video priče dana',
  },
};
