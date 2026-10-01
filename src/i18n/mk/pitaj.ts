import type { Recnik } from '../sr';
import { mnozina } from './gramatika';

/**
 * Prevod `sr/pitaj.ts` (makedonski) — Pitaj astrologa (CLAUDE.md, pravilo 21).
 *
 * Astrolog odgovara GLASOM, NA SRPSKOM. Nikad ne obecavati odgovor na makedonskom: uvod
 * (`uvod.glasovno`) i tekst cekanja (`pitanje.ceka`) to kazu ("на српски").
 */

/** Okviran rok — samo tekst, bez racuna i obecanja (ROKA NEMA, pravilo 21). */
const ROK = 'обично за 2–3 работни дена';
const ROK_KRATKO = '2–3 работни дена';

export const pitaj: Recnik['pitaj'] = {
  /** Ime cirilicom; makedonski nema padeze, pa su genitiv i dativ samo "Бобан". */
  astrolog: {
    ime: 'Бобан Вујовиќ',
    kratko: 'Бобан',
    zvanje: 'Астролог',
    genitiv: 'Бобан',
    dativ: 'Бобан',
  },

  status: {
    noviOdgovor: 'Нов одговор',
    nijePoslato: 'Не е испратено',
    cekaOdgovor: 'Чека одговор',
    odgovoreno: 'Одговорено',
    novacVracen: 'Парите се вратени',
  },

  jaI: (ime) => `Јас и ${ime}`,

  greske: {
    prazno: 'Прашањето е празно. Напиши што те интересира.',
    predugo: (max) => `Прашањето е подолго од ${max} знаци. Скрати го, па испрати го.`,
    nemaKredita: 'Платеното прашање е веќе искористено, на пример од друг телефон. Ова прашање можеш да го платиш.',
    nemaNacrta: 'Ова прашање е веќе испратено.',
    nemaOsobe: 'Оваа особа веќе не е на твојата листа. Избери за кого е прашањето, па испрати.',
    nemaNaloga: 'Најавата истече. Затвори ја апликацијата и отвори ја повторно.',
    mreza: 'Нема врска со серверот. Прашањето е зачувано на телефонот — обиди се кога ќе се врати интернетот.',
    nepoznato: 'Прашањето не е зачувано. Обиди се повторно за една минута.',
  },

  tab: {
    naslov: 'Прашај астролог',
    covek: 'Прашај човек',
    ai: 'Прашај AI',
    uskoro: 'наскоро',
    krediti: (n) => (n === 1
      ? 'Имаш едно платено прашање.'
      : `Имаш ${n} ${mnozina(n, 'платено прашање', 'платени прашања')}.`),
    pitaj: 'Прашај',
    /** Iznad "Postavi pitanje" kad vec ima pitanja (Ivan, 1.10.2026). */
    josJedno: (ime: string) => `Имаш ново прашање? ${ime} ја гледа твојата натална карта и ти одговара со гласовна порака.`,
    postavi: 'Постави прашање',
    mojaPitanja: 'Мои прашања',
    zavrsi: 'Заврши',
    redOpis: (oKome, status, datum) =>
      `${oKome ? `${oKome} · ` : ''}${status} · ${datum}`,
    aiOpis: 'За пократки прашања, одговор веднаш — составен од текстовите на астрологот што веќе ги читаш во апликацијата. Работиме на тоа.',
  },

  uvod: {
    naslov: 'Одговара вистински астролог, не AI',
    opis: (ime) => `Напиши што те интересира, а ${ime} ќе ја погледне твојата натална карта и ќе ти одговори лично.`,
    /** Mora reci da je odgovor na srpskom. */
    glasovno: `Одговорот ти стигнува како гласовна порака, на српски, за ${ROK_KRATKO}.`,
    nijeSavet: 'Астролошкото толкување не е медицински, правен ниту финансиски совет.',
    placanje: 'Еднократно плаќање по прашање',
  },

  novo: {
    posleKupovine: {
      odustao: 'Прашањето е зачувано. Можеш да го испратиш подоцна.',
      ceka: (dativ) => `Плаќањето чека одобрување. Прашањето стигнува до ${dativ} штом ќе се потврди.`,
      greska: 'Плаќањето не е завршено. Прашањето е зачувано — обиди се повторно.',
      nedostupno: 'Плаќањето во апликацијата сè уште не е вклучено. Прашањето е зачувано и чека тука.',
    },
    poslatoNaslov: 'Прашањето е испратено.',
    poslatoOpis: (ime) => `${ime} одговара ${ROK}. Одговорот ќе се појави во „Мои прашања“.`,
    napisi: 'Напиши прашање',
    bezInterneta: 'За испраќање прашање потребен е интернет.',
    vecPlaceno: 'Ова прашање е веќе платено. По испраќањето не може да се менува.',
    placanje: (cena) =>
      `${cena ? `${cena} · еднократно плаќање. ` : ''}По плаќањето прашањето не може да се менува.`,
    naslov: (genitiv) => `Прашање за ${genitiv}`,
    vidiTvoju: (ime) => `${ime} ја гледа твојата карта, па не мораш да пишуваш датум ни место на раѓање.`,
    vidiObe: (ime) => `${ime} ги гледа двете карти, па не мораш да пишуваш податоци за раѓање.`,
    vidiOsobe: (ime) => `${ime} ја гледа картата на особата за која прашуваш, па не мораш да пишуваш нејзини податоци.`,
    oKome: 'За кого е прашањето',
    ja: 'Јас',
    oNamaDvoma: 'Прашањето е за нас двајца — испрати ја и мојата карта',
    primerJa: 'Пр. Размислувам да ја сменам работата оваа есен. Што кажува мојата карта за тој период?',
    primerOdnos: 'Пр. Како подобро да се разбираме кога не се согласуваме?',
    primerOsoba: 'Пр. На што да внимавам оваа есен? Што кажува картата на оваа особа?',
    poljeOpis: 'Твоето прашање',
    brojac: (n, max) => `${n} / ${max}`,
    posalji: 'Испрати прашање',
    naPlacanje: 'Продолжи кон плаќање',
  },

  pitanje: {
    nijeUcitano: 'Прашањето не се вчита. Провери го интернетот и отвори го повторно.',
    nePostoji: 'Ова прашање веќе не постои.',
    oznaka: (status, datum) => `${status} · ${datum}`,
    tvojePitanje: 'Твоето прашање',
    odgovor: 'Одговор',
    glasovnaPoruka: 'Гласовна порака',
    /** Mora reci da je odgovor na srpskom. */
    ceka: (ime) => `${ime} одговара ${ROK}. Одговорот ќе се појави тука, како гласовна порака, на српски.`,
    nijePoslato: 'Прашањето сè уште не е испратено.',
    vraceno: (ime) => `Парите за ова прашање се вратени, па ${ime} нема да го добие.`,
  },

  plejer: {
    pauziraj: 'Паузирај го одговорот',
    pusti: 'Пушти го одговорот',
    napredak: 'Напредок на одговорот',
    /** Citac ekrana: "0:35 од 1:20". */
    vremeOd: (sada, ukupno) => `${sada} од ${ukupno}`,
    brzinaNormalna: 'Нормална брзина',
    brzinaPoIPo: 'Брзина еден и пол пати',
    brzina1: '1x',
    brzina15: '1,5x',
    nijeStigao: 'Снимката не стигна. Провери го интернетот и отвори го прашањето повторно.',
    neMozeDaSePusti: 'Снимката не може да се пушти. Затвори го прашањето и отвори го повторно.',
  },
};
