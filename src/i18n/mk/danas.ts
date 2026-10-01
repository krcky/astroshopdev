import type { Recnik } from '../sr';
import { mnozina } from './gramatika';
import { nebo, subjekat } from './nebo';

/** Prevod `sr/danas.ts` (makedonski). */

type Rod = 'm' | 'z' | 's';
const PADEZI = nebo.padeziTela as Record<string, { rod: Rod }>;

/** Rod tela po kljucu ("venus" -> z); Асцендент, MC i nepoznato su muskog roda. */
const rodKljuca = (kljuc: string): Rod => PADEZI[kljuc]?.rod ?? 'm';

/** Rod po imenu ("Месечина" -> z) — `imeNatalni` dobija samo ime. */
const rodImena = (ime: string): Rod => {
  const kljuc = Object.entries(nebo.tela).find(([, v]) => v === ime)?.[0];
  return kljuc ? rodKljuca(kljuc) : 'm';
};

/** "натален Марс", "натална Месечина", "натално Сонце". */
const natalni = (rod: Rod) => ({ m: 'натален', z: 'натална', s: 'натално' })[rod];

/** Redni broj kuce (zenski rod, bez clana — clan nosi "твојата"): "1-ва", "2-ра", "5-та", "7-ма". */
const redni = (n: number): string => {
  const s = n % 100;
  if (s < 11 || s > 19) {
    const d = n % 10;
    if (d === 1) return `${n}-ва`;
    if (d === 2) return `${n}-ра`;
    if (d === 7 || d === 8) return `${n}-ма`;
  }
  return `${n}-та`;
};

export const danas: Recnik['danas'] = {
  tabovi: {
    danas: 'Денес',
    tranziti: 'Транзити',
    pitaj: 'Прашај',
    ti: 'Ти',
    nebo: 'Небо',
  },

  pocetna: {
    tabTvojDan: 'Твојот ден',
    tabMesec: 'Месечина',
    tabPromene: 'Промени',
    tabTeme: 'Теми',
    danasUkratko: 'Денес накратко',
    ukratko: 'Накратко',
    ideTi: 'Ти оди',
    kociTe: 'Те кочи',
    nemaTranzitaDana: 'За овој ден нема изразени транзити.',
    promeneNadnaslov: 'Што те чека во наредниот период',
    promeneNaslov: 'Промени на небото',
    nemaPromena: 'Ниту една планета наскоро не менува знак ни насока.',
    temeNadnaslov: 'Транзити што траат со недели и месеци',
    temeNaslov: 'Теми на периодот',
    nemaTema: 'Овие денови ниту една бавна планета не е во аспект со твојата карта.',
    josUTranzitima: (n) => `Уште ${n} во Транзити`,
    profil: 'Профил',
    dan: 'Ден',
    promeniDan: 'Промени ден',
    drugiDaniUzPremium: 'Други денови со Premium',
    izabranDan: (dan, opis) => `Избран ден: ${dan}. ${opis}`,
    danUzPremium: (dan) => `${dan}. Со Premium`,
    zatvoriMeni: 'Затвори мени',
    relativniDani: ['Завчера', 'Вчера', 'Денес', 'Утре', 'Задутре'],
  },

  tranzit: {
    ime: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalna}`,
    imeNatalni: (tranzitna, aspekt, natalna) => `${tranzitna} ${aspekt} ${natalni(rodImena(natalna))} ${natalna}`,
    ascendent: 'Асцендент',
    mc: 'MC',
    samoDanas: 'Само денес',
    uTvojojKuci: (kuca) => `Во твојата ${redni(kuca)} куќа`,
    lunacijaVeci: (naslov, tema) => `${naslov}: ${tema}`,
    lunacijaManji: (faza, kuca) => `${faza} во твојата ${redni(kuca)} куќа`,
  },

  oblasti: {
    imena: {
      ljubav: 'Љубов',
      zdravlje: 'Здравје и убавина',
      karijera: 'Кариера и финансии',
      kuca: 'Дом и градина',
    },
    oznakaOcene: { 5: 'Одличен ден', 4: 'Добар ден', 3: 'Мирен ден', 2: 'Внимателно', 1: 'Тежок ден' },
    lunacijaMlad: 'Нов почеток',
    lunacijaPun: 'Врв',
  },

  ocene: {
    otvorena: (oblast, ocena, oznaka) => `${oblast}, оценка ${ocena} од 5, ${oznaka}`,
    zakljucana: (oblast) => `${oblast}, со Premium`,
    otvaraPremium: 'Го отвора Premium',
    otvaraTranzite: 'Ги отвора транзитите',
  },

  ton: {
    povoljno: 'Поволно',
    izazovno: 'Предизвикувачко',
    mesovito: 'Мешано',
    oznaka: (ton) => `Тон: ${ton}`,
  },

  tranziti: {
    nemaNaKarti: 'Денес нема транзити на оваа карта.',
    nemaTvojih: 'Денес немаш транзити.',
    josDanas: (n, tranzita) => `Уште ${n} ${tranzita} денес`,
    zakljucaniOpis: 'Најсилните се отворени на врвот на листата. И другите влијаат на твојот ден, и секој има свое целосно толкување.',
    otkljucajSve: 'Отклучи ги сите транзити',
    otvaraCeoTekst: 'Го отвора целото толкување на транзитот',
  },

  trajanje: {
    od: (dan) => `Од ${dan}`,
    duzeOdTriGodine: 'Трае подолго од три години',
  },

  tvojDan: {
    oznaka: 'Твојот ден',
    zastoOvajTekst: 'Зошто токму овој текст?',
    saznajVise: 'Дознај повеќе',
    efekat: 'Позитивен ефект',
    pazi: 'Предизвик',
    savet: 'Совет',
  },

  tvojDanInfo: {
    naslov: 'Зошто токму овој текст?',
    uvod: 'Текстот е напишан за транзитот што денес е најважен во твојата натална карта.',
    tranzitDana: 'Транзит на денот',
    objasnjenje: (ugao) => `Планета од денешното небо и аголот од ${ugao}° што го зафаќа со точка од твојата натална карта.`,
    tranzitVladara: 'Транзит на твојот владетел',
    nijeDeoKarte: 'Овој транзит не е дел од твојата карта.',
    vladarNatalni: (planeta, uZnaku) =>
      `${subjekat(planeta)} е владетел на твојот Асцендент ${uZnaku}. Кога транзит ќе го допре, денот е поличен и посилен, затоа овој транзит денес има предност.`,
    /** "влијае на" — без клитика, па родот на `koga` не мора да се слага. */
    vladarTranzitni: (planeta, uZnaku, koga) =>
      `${subjekat(planeta)} е владетел на твојот Асцендент ${uZnaku}, а денес влијае на ${koga}. Затоа овој транзит денес има предност.`,
    tvojAkuzativ: {
      sun: 'твоето Сонце', moon: 'твојата Месечина', mercury: 'твојот Меркур', venus: 'твојата Венера',
      mars: 'твојот Марс', jupiter: 'твојот Јупитер', saturn: 'твојот Сатурн', uranus: 'твојот Уран',
      neptune: 'твојот Нептун', pluto: 'твојот Плутон', ascendant: 'твојот Асцендент', midheaven: 'твојот MC',
    },
  },

  tumacenje: {
    osobaViseNije: 'Оваа особа веќе не е на твојата листа.',
    tranzit: 'Транзит',
    nijeNapisano: 'Толкувањето за овој транзит сè уште не е напишано.',
    stizeKadVeza: 'Целиот текст ќе се појави кога ќе се врати врската.',
    procitajDoKraja: 'Прочитај до крај',
    viseOTranzitu: 'Повеќе за овој транзит',
    pitajNaslov: 'Прашај астролог за овој транзит',
    pitajOpis: (astrolog, oOsobi) =>
      `${astrolog} ја гледа ${oOsobi ? 'картата на оваа особа' : 'твојата карта'} и одговара со гласовна порака на српски, обично за 2–3 работни дена.`,
    postaviPitanje: 'Постави прашање',
    kratkaVerzija: 'Ова е кратката верзија. Во целосната се областите од животот врз кои делува транзитот, долгорочните ефекти и конкретни совети.',
    otkljucajCeo: 'Отклучи го целиот текст',
  },

  mesecDanas: {
    oznaka: 'Месечината денес',
    osvetljen: (pct) => `${pct}% осветлена`,
    naslov: (faza, uZnaku) => `${faza} ${uZnaku}`,
    slika: (naslov, pct, raste) =>
      `${naslov}, осветленост ${pct} ${mnozina(pct, 'процент', 'проценти')}, ${raste ? 'расте' : 'опаѓа'}`,
    saznajVise: 'Дознај повеќе',
    nemaSaveta: 'Советите за оваа област сè уште не пристигнале.',
    saveteKadVeza: 'Советите ќе се појават кога ќе се врати врската.',
    zaTebe: 'За тебе',
    tabovi: {
      ljubav: 'Љубов',
      zdravlje: 'Здравје и убавина',
      karijera: 'Кариера и финансии',
      kuca: 'Дом',
      basta: 'Градина',
    },
  },

  promena: {
    /** "Марс влегува во Лав". */
    ulazi: (planeta, uZnak) => `${subjekat(planeta)} влегува ${uZnak}`,
    retrogradna: (kljuc, planeta, uZnaku) =>
      `${{ m: 'Ретрограден', z: 'Ретроградна', s: 'Ретроградно' }[rodKljuca(kljuc)]} ${planeta} ${uZnaku}`,
    direktna: (kljuc, planeta, uZnaku) =>
      `${planeta} повторно ${{ m: 'директен', z: 'директна', s: 'директно' }[rodKljuca(kljuc)]} ${uZnaku}`,
    traje: (doKad) => `Трае ${doKad}`,
  },

  horoskop: {
    nebo: (znak, faza, retrogradni) =>
      `Месечината во знакот ${znak} · ${faza}` + (retrogradni.length ? ` · ретроградни: ${retrogradni.join(', ')}` : ''),
  },

  ui: {
    ucitavam: 'Се вчитува',
    poljeDan: 'ден',
    poljeMesec: 'месец',
    poljeGodina: 'година',
    poljeSat: 'час',
    poljeMinut: 'минута',
  },
};
