import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * PRICE (pravila 23 i 25), slovenski — prevod `sr/prica.ts`.
 *
 * DVA LICA, kao u srpskom: slika u prici je drugo lice ("Tvoj dan", "Gre ti"), kartica za deljenje i
 * video prvo lice ("Moj dan", "Gre mi"). BROJ RECI ODREDJUJE TRAJANJE SLIKE — kratko.
 * Znak = "znamenje" (srednji rod): "Prvo znamenje zodiaka", "Ognjeno, kardinalno znamenje".
 * Dvojcka i Ribi su DVOJINA: "Dvojčkoma vlada Merkur", "ki mu vladata Dvojčka".
 */
type ZnakKljuc = keyof Recnik['nebo']['znaci'];

/** Redni broj znamenja (srednji rod), od Ovna. */
const REDNI = ['Prvo', 'Drugo', 'Tretje', 'Četrto', 'Peto', 'Šesto', 'Sedmo', 'Osmo', 'Deveto', 'Deseto', 'Enajsto', 'Dvanajsto'];
const ELEMENT_PRIDEV = { vatra: 'ognjeno', zemlja: 'zemeljsko', vazduh: 'zračno', voda: 'vodno' } as const;
const KVALITET_PRIDEV = { kardinalan: 'kardinalno', fiksni: 'fiksno', promenljiv: 'spremenljivo' } as const;
/** Letni cas (severna polobla), od pomladi: [tozilnik, rodilnik] — "odpira pomlad", "sredina pomladi". */
const DOBA: readonly (readonly [string, string])[] = [['pomlad', 'pomladi'], ['poletje', 'poletja'], ['jesen', 'jeseni'], ['zimo', 'zime']];
/** Dajalnik imena znamenja: "Ovnu vlada Mars"; Dvojcka in Ribi v dvojini. */
const DAJALNIK: Record<ZnakKljuc, string> = {
  aries: 'Ovnu', taurus: 'Biku', gemini: 'Dvojčkoma', cancer: 'Raku', leo: 'Levu', virgo: 'Devici',
  libra: 'Tehtnici', scorpio: 'Škorpijonu', sagittarius: 'Strelcu', capricorn: 'Kozorogu', aquarius: 'Vodnarju', pisces: 'Ribama',
};
/** Znamenji v dvojini: "Dvojčka vladata", ne "vlada". */
const DVOJINA_ZNAKA = new Set(['gemini', 'pisces']);

const vFoto = (ios: boolean) => (ios ? 'Fotografijah' : 'Galeriji');
const vFotoKam = (ios: boolean) => (ios ? 'Fotografije' : 'Galerijo');

export const prica: Recnik['prica'] = {
  /** Domena — ne prevaja se. */
  sajt: 'astroshop.rs',
  uzSajt: (ispred) => `${ispred} · astroshop.rs`,
  /** Ime datoteke ostane "Astro Shop …". */
  imeFajla: (sta) => `Astro Shop ${sta}`,
  /** Slovenski pravopis: presledek pred znakom za odstotek. */
  procenat: (n) => `${n} %`,

  plejer: {
    zatvori: 'Zapri zgodbo',
    podeliVideoSePravi: (procenat) => `Deli. Video se ustvarja, ${procenat}`,
    novaPricaStize: 'Nova zgodba pride vsak dan, na začetnem zaslonu.',
    prethodnaSlika: 'Prejšnja slika',
    sledecaSlika: (redni, od) => `Naslednja slika, ${redni} od ${od}`,
  },

  ulaz: {
    pricaDana: 'Zgodba dneva',
    hint: 'Odpre kratko zgodbo o tvojem dnevu',
  },

  /** Slika v zgodbi — DRUGA OSEBA. */
  dnevna: {
    tvojDan: 'Tvoj dan',
    nemaAspekata: 'Danes noben planet ne tvori aspekta s tvojo karto.',
    najvaznijeDanas: (momenat) => `Najpomembnejše danes · ${momenat}`,
    najboljeTiIde: 'Najbolj ti gre',
    boljeNegoJuce: '↑ bolje kot včeraj',
    ocenaA11y: (oblast, ocena, oznaka, bolje) =>
      `${oblast}, ${ocena} od 5, ${oznaka}${bolje ? ', bolje kot včeraj' : ''}`,
    ideTi: 'Gre ti',
    kociTe: 'Zavira te',
    mesecDanas: (sledeca) => `Luna danes · ${sledeca}`,
    zaTebe: 'Zate',
    izTumacenja: (tranzit) => `Iz razlage tranzita ${tranzit}.`,
    savetDana: 'Nasvet dneva',
    podeliSvojDan: 'Deli svoj dan',
    procitajCeo: 'Preberi celo besedilo',
  },

  /** Kartica za deljenje in video — PRVA OSEBA. */
  kartica: {
    mojDan: 'Moj dan',
    najboljeMiIde: 'Najbolj mi gre',
    ideMi: 'Gre mi',
    kociMe: 'Zavira me',
    zaMene: 'Zame',
  },

  racun: {
    /** "1 skladen, 2 skladna, 3 skladni, 5 skladnih" (tranziti, moski spol). */
    ton: {
      povoljno: (n) => `${n} ${mnozina(n, ['skladen', 'skladna', 'skladni', 'skladnih'])}`,
      mesovito: (n) => `${n} ${mnozina(n, ['mešan', 'mešana', 'mešani', 'mešanih'])}`,
      izazovno: (n) => `${n} ${mnozina(n, ['napet', 'napeta', 'napeti', 'napetih'])}`,
    },
    momenat: {
      egzaktan: 'natančen danes',
      pocinje: 'začne se danes',
      zavrsava: 'zadnji dan',
    },
    imeTranzita: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    sledi: (faza, datum) => `Sledi: ${faza}, ${datum}`,
  },

  znak: {
    podnaslov: 'Tvoje znamenje',
    redni: (i) => `${REDNI[i]} znamenje zodiaka`,
    element: { vatra: 'Ogenj', zemlja: 'Zemlja', vazduh: 'Zrak', voda: 'Voda' },
    /** Ob oznaki "Modalnost" (zenski spol). */
    kvalitet: { kardinalan: 'Kardinalna', fiksni: 'Fiksna', promenljiv: 'Spremenljiva' },
    /** Ob oznaki "Polarnost" (zenski spol). */
    polaritet: { pozitivan: 'Pozitivna', negativan: 'Negativna' },
    polaritetOpis: {
      pozitivan: 'kot vsa ognjena in zračna znamenja',
      negativan: 'kot vsa zemeljska in vodna znamenja',
    },
    osnove: (element, kvalitet) => {
      const p: string = ELEMENT_PRIDEV[element];
      return `${p[0].toUpperCase()}${p.slice(1)}, ${KVALITET_PRIDEV[kvalitet]} znamenje`;
    },
    doba: (doba, deo) => {
      const [tozilnik, rodilnik] = DOBA[doba];
      return [`odpira ${tozilnik}`, `sredina ${rodilnik}`, `konec ${rodilnik}`][deo];
    },
    srodni: (imena) => `kot ${imena.join(' in ')}`,
    /** "Del telesa, ki mu vlada Oven" / "… ki mu vladata Dvojčka". */
    teloOznaka: (znakKljuc, ime) => `Del telesa, ki mu ${DVOJINA_ZNAKA.has(znakKljuc) ? 'vladata' : 'vlada'} ${ime}`,
    vladarNaslov: (znakKljuc, vladar) => `${DAJALNIK[znakKljuc as ZnakKljuc]} vlada ${vladar}`,
    vladarMit: { sun: 'Grki so ga imenovali Helios.' },
    /** `lokativi` = mestnik iz `nebo.znaci`: "v Dvojčkih ali Raku". */
    vladarRecenica: (vladar, lokativi, lice = 'ti') =>
      `V ${lice === 'ja' ? 'moji' : 'tvoji'} rojstni karti je ${vladar} v ${lokativi.join(' ali ')}.`,
    sunceU: (uZnaku) => `Sonce ${uZnaku}`,
    procitaj: (tema) => `Preberi: ${tema}`,
    sunceNa: (stepen) => `Sonce na ${stepen}°`,

    sazvezdjeOznaka: { ti: 'Tvoje ozvezdje', ja: 'Moje ozvezdje' },
    sazvezdjeNaslov: { ti: 'Po teh zvezdah je tvoje znamenje dobilo ime.', ja: 'Po teh zvezdah je moje znamenje dobilo ime.' },
    ukratko: (ime) => `${ime} na kratko`,
    najveceVrednosti: 'Največje vrednote',
    uLjubavi: 'V ljubezni',
    naPoslu: 'V službi',
    osvojitiOznaka: { ti: 'Kako te osvojiti', ja: 'Kako me osvojiš' },
    osnoveZnaka: 'Osnove znamenja',
    oznakaElement: 'Element',
    oznakaKvalitet: 'Modalnost',
    oznakaPol: 'Spol',
    oznakaPolaritet: 'Polarnost',
    oznakaIzgled: 'Videz',
    znakUStvarima: 'Znamenje v stvareh',
    stvariNaslov: 'Kamen, barva, rastlina in hrana',
    dragiKamen: 'Dragi kamen',
    boja: 'Barva',
    biljka: 'Rastlina',
    hrana: 'Hrana',
    zivotinja: 'Žival',
    vladarZnaka: 'Vladar znamenja',
    danasNaslov: 'In kaj je danes?',
    podeliSvojZnak: 'Deli svoje znamenje',
  },

  posao: {
    naslovDana: 'Zgodba dneva',
    /** Datum ("1. okt. 2026") se konca z letnico; za vsak slucaj brez dvojne pike. */
    opisDana: (datum) => `Zgodba dneva, ${datum.replace(/\.$/, '')}.`,
    opisZnaka: (znak) => `Zgodba o tvojem znamenju, ${znak}.`,
    obavestenjeNaslov: 'Tvoj video je pripravljen',
    obavestenjeTekst: (opis) => `${opis} Tapni, da ga deliš.`,
    kanal: 'Video zgodbe',
  },

  ponudi: {
    upravoPravimo: (drugi) => `Pravkar ustvarjamo video: ${drugi}. Tega lahko narediš, ko bo tisti končan.`,
    sePravi: (procenat) => `Video se ustvarja · ${procenat}. Sporočili ti bomo, ko bo končan.`,
    spreman: 'Video cele zgodbe je pripravljen.',
    pravimoOkoMinut: 'Video ustvarjamo približno minuto. Medtem uporabljaj aplikacijo — sporočili ti bomo, ko bo končan.',
    ovaSlika: 'Ta slika',
    pogledajVideo: 'Poglej video',
    celaPrica: 'Cela zgodba, video',
    sePraviDugme: (procenat) => `Video se ustvarja · ${procenat}`,
    cekaDrugi: 'Video — čaka drug video',
  },

  traka: {
    pravimo: 'Ustvarjamo tvoj video',
    spreman: 'Tvoj video je pripravljen',
    nijeUspeo: 'Video ni uspel',
    pokusajIzPrice: 'Poskusi znova iz zgodbe.',
    uToku: (naslov, procenat) => `${naslov} · ${procenat}`,
    a11y: (naslov, podnaslov) => `${naslov}. ${podnaslov}`,
    podeliVideo: 'Deli video',
    skloni: 'Skrij trak',
  },

  /** "Fotografije" (iOS) in "Galerija" (Android) sta imeni sistemskih aplikacij. */
  video: {
    naslov: 'Tvoj video',
    pricaDana: 'Zgodba dneva',
    pricaOZnaku: 'Zgodba o tvojem znamenju',
    podeliVideo: 'Deli video',
    doKrajaDana: 'V aplikaciji je do konca dneva.',
    doKrajaDanaGalerija: (ios) => `V aplikaciji je do konca dneva, v ${vFoto(ios)} pa ostane.`,
    dokNeNapravisNov: 'V aplikaciji je, dokler ne narediš novega.',
    dokNeNapravisNovGalerija: (ios) => `V aplikaciji je, dokler ne narediš novega, v ${vFoto(ios)} pa ostane.`,
    pravimo: (procenat) => `Ustvarjamo tvoj video · ${procenat}`,
    zaToVreme: 'Medtem uporabljaj aplikacijo. Če jo zapustiš, se ustvarjanje ob vrnitvi začne znova.',
    nijeUspeo: (dnevni) =>
      `Video ni uspel. Odpri ${dnevni ? 'zgodbo dneva' : 'zgodbo o znamenju'} in poskusi znova: gumb „Deli“, nato „Cela zgodba, video“.`,
    nemaDanas: 'Danes še ni videa. Narediš ga iz zgodbe dneva: gumb „Deli“, nato „Cela zgodba, video“.',
    nemaZnaka: 'Video znamenja še ni narejen. Narediš ga iz zgodbe o znamenju (zavihek „Ti“): gumb „Deli“, nato „Cela zgodba, video“.',
    bezDozvole: (ios) => `Astro Shop nima dovoljenja za dodajanje v ${vFotoKam(ios)}.`,
    otvoriPodesavanja: 'Odpri Nastavitve',
    sacuvano: (ios) => `Shranjeno v ${vFoto(ios)}`,
    sacuvaj: (ios) => `Shrani v ${vFotoKam(ios)}`,
    nijeSacuvan: 'Video ni shranjen. Poskusi znova.',
    a11yPregled: 'Video zgodbe dneva',
  },
};
