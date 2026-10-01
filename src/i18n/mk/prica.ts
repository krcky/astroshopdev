import type { Recnik } from '../sr';
import { mnozina } from './gramatika';
import { nebo, subjekat } from './nebo';

/**
 * PRICE (pravila 23 i 25), makedonski — prevod `sr/prica.ts`. Ceo tekst cirilicom; latinicom samo
 * "Astro Shop" i "astroshop.rs".
 *
 * DVA LICA, kao u srpskom: slika u prici je drugo lice ("Твојот ден", "Ти оди"), kartica za deljenje
 * i video prvo lice ("Мојот ден", "Ми оди"). BROJ RECI ODREDJUJE TRAJANJE SLIKE — kratko.
 * Vladar: "Марс владее со Овен" (isto za svih 12, bez padeza); Близнаци i Риби su mnozina ("владеат").
 */
/** Redni broj znaka u zodijaku, od Ovna. */
const REDNI = ['Прв', 'Втор', 'Трет', 'Четврти', 'Петти', 'Шести', 'Седми', 'Осми', 'Деветти', 'Десетти', 'Единаесетти', 'Дванаесетти'];
const ELEMENT_PRIDEV = { vatra: 'огнен', zemlja: 'земјен', vazduh: 'воздушен', voda: 'воден' } as const;
const KVALITET_PRIDEV = { kardinalan: 'кардинален', fiksni: 'фиксен', promenljiv: 'променлив' } as const;
/** Godisnje doba (severna polulopta), od proleca, sa clanom: "почеток на пролетта". */
const DOBA = ['пролетта', 'летото', 'есента', 'зимата'];
/** Znaci cije je ime u mnozini: "Близнаци владеат", ne "владее". */
const MNOZINA_ZNAKA = new Set(['gemini', 'pisces']);

const foto = (ios: boolean) => (ios ? 'Фотографии' : 'Галерија');

export const prica: Recnik['prica'] = {
  /** Domen — ne prevodi se. */
  sajt: 'astroshop.rs',
  uzSajt: (ispred) => `${ispred} · astroshop.rs`,
  /** Ime fajla ostaje latinicom: "Astro Shop …". */
  imeFajla: (sta) => `Astro Shop ${sta}`,
  procenat: (n) => `${n} %`,

  plejer: {
    zatvori: 'Затвори ја приказната',
    podeliVideoSePravi: (procenat) => `Сподели. Видеото се прави, ${procenat}`,
    novaPricaStize: 'Нова приказна стига секој ден, на почетниот екран.',
    prethodnaSlika: 'Претходна слика',
    sledecaSlika: (redni, od) => `Следна слика, ${redni} од ${od}`,
  },

  ulaz: {
    pricaDana: 'Приказна на денот',
    hint: 'Отвора кратка приказна за твојот ден',
  },

  /** Slika u prici — DRUGO LICE. */
  dnevna: {
    tvojDan: 'Твојот ден',
    nemaAspekata: 'Денес ниту една планета не прави аспект со твојата карта.',
    najvaznijeDanas: (momenat) => `Најважно денес · ${momenat}`,
    najboljeTiIde: 'Најдобро ти оди',
    boljeNegoJuce: '↑ подобро од вчера',
    ocenaA11y: (oblast, ocena, oznaka, bolje) =>
      `${oblast}, ${ocena} од 5, ${oznaka}${bolje ? ', подобро од вчера' : ''}`,
    ideTi: 'Ти оди',
    kociTe: 'Те кочи',
    mesecDanas: (sledeca) => `Месечината денес · ${sledeca}`,
    zaTebe: 'За тебе',
    izTumacenja: (tranzit) => `Од толкувањето на транзитот ${tranzit}.`,
    savetDana: 'Совет на денот',
    podeliSvojDan: 'Сподели го својот ден',
    procitajCeo: 'Прочитај го целиот текст',
  },

  /** Kartica za deljenje i video — PRVO LICE. */
  kartica: {
    mojDan: 'Мојот ден',
    najboljeMiIde: 'Најдобро ми оди',
    ideMi: 'Ми оди',
    kociMe: 'Ме кочи',
    zaMene: 'За мене',
  },

  racun: {
    ton: {
      povoljno: (n) => `${n} ${mnozina(n, 'складен', 'складни')}`,
      mesovito: (n) => `${n} ${mnozina(n, 'мешан', 'мешани')}`,
      izazovno: (n) => `${n} ${mnozina(n, 'напнат', 'напнати')}`,
    },
    momenat: {
      egzaktan: 'точен денес',
      pocinje: 'почнува денес',
      zavrsava: 'последен ден',
    },
    imeTranzita: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    sledi: (faza, datum) => `Следува: ${faza}, ${datum}`,
  },

  znak: {
    podnaslov: 'Твојот знак',
    redni: (i) => `${REDNI[i]} знак на зодијакот`,
    element: { vatra: 'Оган', zemlja: 'Земја', vazduh: 'Воздух', voda: 'Вода' },
    kvalitet: { kardinalan: 'Кардинален', fiksni: 'Фиксен', promenljiv: 'Променлив' },
    polaritet: { pozitivan: 'Позитивен', negativan: 'Негативен' },
    polaritetOpis: {
      pozitivan: 'како сите огнени и воздушни знаци',
      negativan: 'како сите земјени и водени знаци',
    },
    osnove: (element, kvalitet) => {
      const p: string = ELEMENT_PRIDEV[element];
      return `${p[0].toUpperCase()}${p.slice(1)}, ${KVALITET_PRIDEV[kvalitet]} знак`;
    },
    doba: (doba, deo) => [`почеток на ${DOBA[doba]}`, `средина на ${DOBA[doba]}`, `крај на ${DOBA[doba]}`][deo],
    srodni: (imena) => `како ${imena.join(' и ')}`,
    /** "Дел од телото со кој владее Овен" / "… владеат Близнаци". */
    teloOznaka: (znakKljuc, ime) => `Дел од телото со кој ${MNOZINA_ZNAKA.has(znakKljuc) ? 'владеат' : 'владее'} ${ime}`,
    /** "Марс владее со Овен". */
    vladarNaslov: (znakKljuc, vladar) =>
      `${subjekat(vladar)} владее со ${nebo.znaci[znakKljuc as keyof typeof nebo.znaci]?.ime ?? znakKljuc}`,
    vladarMit: { sun: 'Грците го нарекувале Хелиос.' },
    vladarRecenica: (vladar, lokativi, lice = 'ti') =>
      `Во ${lice === 'ja' ? 'мојата' : 'твојата'} натална карта ${subjekat(vladar)} е во ${lokativi.join(' или ')}.`,
    sunceU: (uZnaku) => `Сонце ${uZnaku}`,
    procitaj: (tema) => `Прочитај: ${tema}`,
    sunceNa: (stepen) => `Сонце на ${stepen}°`,

    sazvezdjeOznaka: { ti: 'Твоето соѕвездие', ja: 'Моето соѕвездие' },
    sazvezdjeNaslov: { ti: 'По овие ѕвезди твојот знак го добил името.', ja: 'По овие ѕвезди мојот знак го добил името.' },
    ukratko: (ime) => `${ime} накратко`,
    najveceVrednosti: 'Најголеми вредности',
    uLjubavi: 'Во љубовта',
    naPoslu: 'На работа',
    osvojitiOznaka: { ti: 'Како да те освојат', ja: 'Како да ме освоиш' },
    osnoveZnaka: 'Основи на знакот',
    oznakaElement: 'Елемент',
    oznakaKvalitet: 'Квалитет',
    oznakaPol: 'Пол',
    oznakaPolaritet: 'Поларитет',
    oznakaIzgled: 'Изглед',
    znakUStvarima: 'Знакот во нештата',
    stvariNaslov: 'Камен, боја, растение и храна',
    dragiKamen: 'Скапоцен камен',
    boja: 'Боја',
    biljka: 'Растение',
    hrana: 'Храна',
    zivotinja: 'Животно',
    vladarZnaka: 'Владетел на знакот',
    podeliSvojZnak: 'Сподели го својот знак',
  },

  posao: {
    naslovDana: 'Приказна на денот',
    /** Datum ("1 окт 2026") nema tacku na kraju; za svaki slucaj bez dvostruke. */
    opisDana: (datum) => `Приказна на денот, ${datum.replace(/\.$/, '')}.`,
    opisZnaka: (znak) => `Приказна за твојот знак, ${znak}.`,
    obavestenjeNaslov: 'Твоето видео е подготвено',
    obavestenjeTekst: (opis) => `${opis} Допри за да го споделиш.`,
    kanal: 'Видео приказни',
  },

  ponudi: {
    upravoPravimo: (drugi) => `Во моментов правиме видео: ${drugi}. Ова ќе може штом тоа ќе биде готово.`,
    sePravi: (procenat) => `Видеото се прави · ${procenat}. Ќе ти јавиме кога ќе биде готово.`,
    spreman: 'Видеото од целата приказна е подготвено.',
    pravimoOkoMinut: 'За видеото ни треба околу една минута. Дотогаш користи ја апликацијата — ќе ти јавиме кога ќе биде готово.',
    ovaSlika: 'Оваа слика',
    pogledajVideo: 'Погледни го видеото',
    celaPrica: 'Целата приказна, видео',
    sePraviDugme: (procenat) => `Видеото се прави · ${procenat}`,
    cekaDrugi: 'Видео — чека друго видео',
  },

  traka: {
    pravimo: 'Го правиме твоето видео',
    spreman: 'Твоето видео е подготвено',
    nijeUspeo: 'Видеото не успеа',
    pokusajIzPrice: 'Обиди се повторно од приказната.',
    uToku: (naslov, procenat) => `${naslov} · ${procenat}`,
    a11y: (naslov, podnaslov) => `${naslov}. ${podnaslov}`,
    podeliVideo: 'Сподели го видеото',
    skloni: 'Тргни ја лентата',
  },

  /** "Фотографии" (iOS) i "Галерија" (Android) su imena sistemskih aplikacija. */
  video: {
    naslov: 'Твоето видео',
    pricaDana: 'Приказна на денот',
    pricaOZnaku: 'Приказна за твојот знак',
    podeliVideo: 'Сподели го видеото',
    doKrajaDana: 'Во апликацијата е до крајот на денот.',
    doKrajaDanaGalerija: (ios) => `Во апликацијата е до крајот на денот, а во ${foto(ios)} останува.`,
    dokNeNapravisNov: 'Во апликацијата е додека не направиш ново.',
    dokNeNapravisNovGalerija: (ios) => `Во апликацијата е додека не направиш ново, а во ${foto(ios)} останува.`,
    pravimo: (procenat) => `Го правиме твоето видео · ${procenat}`,
    zaToVreme: 'Дотогаш користи ја апликацијата. Ако излезеш од неа, правењето почнува одново кога ќе се вратиш.',
    nijeUspeo: (dnevni) =>
      `Видеото не успеа. Отвори ја ${dnevni ? 'приказната на денот' : 'приказната за знакот'} и обиди се повторно: копче „Сподели“, па „Целата приказна, видео“.`,
    nemaDanas: 'Денес сè уште нема видео. Ќе го направиш од приказната на денот: копче „Сподели“, па „Целата приказна, видео“.',
    nemaZnaka: 'Видеото за знакот сè уште не е направено. Ќе го направиш од приказната за знакот (табот „Ти“): копче „Сподели“, па „Целата приказна, видео“.',
    bezDozvole: (ios) => `Astro Shop нема дозвола да додава во ${foto(ios)}.`,
    otvoriPodesavanja: 'Отвори Поставки',
    sacuvano: (ios) => `Зачувано во ${foto(ios)}`,
    sacuvaj: (ios) => `Зачувај во ${foto(ios)}`,
    nijeSacuvan: 'Видеото не е зачувано. Обиди се повторно.',
    a11yPregled: 'Видео од приказната на денот',
  },
};
