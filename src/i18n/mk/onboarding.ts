import type { Recnik } from '../sr';
import { nebo, subjekat } from './nebo';

/** Koraci onboardinga, prijava i racun (makedonski) — vidi `sr/onboarding.ts`. Jedan objekat po ekranu, redom kao u toku. */
export const onboarding: Recnik['onboarding'] = {
  korak: {
    odustani: 'Откажи',
    /** Podrazumevana recenica iznad dugmeta. */
    privatnost: 'Ова го користиме за да ја пресметаме твојата натална карта. Не ги споделуваме и не ги продаваме твоите податоци.',
  },

  welcome: {
    /** Ispod imena; dva razmaka sa obe strane tacke su namerna. */
    podnaslov: 'Осн. 2004  ·  Белград',
    napraviNalog: 'Направи сметка',
    vecImamNalog: 'Веќе имам сметка',
  },

  datum: {
    naslov: 'Датум на раѓање',
    izaberi: 'Избери датум',
  },

  vreme: {
    naslov: 'Време на раѓање',
    izaberi: 'Избери време',
    neZnam: 'Не го знам времето',
  },

  mesto: {
    naslov: 'Место на раѓање',
  },

  pretragaGrada: {
    placeholder: 'Град',
    trazimDalje: 'Барам уште…',
  },

  reveal: {
    neMozemo: 'Не можеме да ја пресметаме картата',
    zonaNepouzdana: (grad, zona) =>
      `Не знаеме сигурно колку часот било по UTC во ${grad} на тој датум. Пробај друго место на раѓање или јави ни — зона: ${zona}`,
    nazadNaMesto: 'Назад на местото на раѓање',
    greskaCuvanja: 'Картата не е зачувана — не успеавме да стигнеме до серверот. Провери го интернетот и притисни Продолжи повторно.',
    izvorPozicija: 'Позициите ги пресметуваме од податоците за движењето на планетите, за твојот точен момент и место на раѓање.',
    vladajucaPlaneta: (planeta) => `Владејачка планета: ${planeta}`,
    vladarZnaka: (planeta) => `Владетел на твојот знак: ${planeta}`,
    vladarKarte: (planeta) => `Владетел на твојата карта: ${planeta}`,
    sunce: 'Сонце',
    mesec: 'Месечина',
    podznak: 'Подзнак',
    uloga: (uloga, znak) => `${uloga}: ${znak}`,
    nepoznat: 'непознат',
    bezVremena: 'Без време на раѓање асцендентот не може да се пресмета. Ќе го дополниш подоцна во профилот.',
  },

  nalogEmail: {
    naslovKod: 'Која е твојата е-пошта?',
    naslovLozinka: 'Направи сметка',
    podnaslovKod: 'Ти праќаме код за најава. Без лозинка, без реклами, и е-поштата не ја споделуваме со никого.',
    podnaslovLozinka: 'Сметката ја чува твојата карта кога ќе го смениш телефонот. Е-поштата не ја споделуваме со никого.',
    posaljiKod: 'Прати ми код',
    placeholderEmail: 'Адреса на е-пошта',
    placeholderLozinka: 'Лозинка (најмалку 6 знаци)',
    emailZauzet: 'Оваа е-пошта веќе има сметка. Внеси друга.',
    nijePodesen: 'Сметката сè уште не е поставена.',
    robot: 'Не успеавме да потврдиме дека не си робот. Провери го интернетот и пробај повторно.',
    previsePokusaja: 'Премногу обиди. Почекај една минута и пробај повторно.',
    kodNijePoslat: 'Не успеавме да го пратиме кодот. Провери ја е-поштата и интернетот.',
    lozinkaNetacna: 'Сметка со оваа е-пошта постои, но лозинката не е точна.',
    lozinkaKratka: 'Лозинката мора да има најмалку 6 знаци.',
    nalogNijeNapravljen: 'Не успеавме да направиме сметка. Провери ги податоците и интернетот.',
    potvrdaUkljucena: 'Потврдата на е-пошта е вклучена во Supabase. Исклучи ја во Authentication → Sign In / Providers → Email.',
    nalogNijeUcitan: 'Не успеавме да ја вчитаме сметката. Провери го интернетот и пробај повторно.',
    drustvenaPrijava: 'Најавата со Apple и Google сметка ќе се вклучи кога ќе направиме dev build.',
  },

  prijavaDugme: {
    apple: 'Продолжи со Apple',
    google: 'Продолжи со Google',
  },

  kod: {
    naslov: 'Внеси го кодот',
    poslatPre: 'Пративме шестцифрен код на\n',
    poslatPosle: '.',
    potvrdi: 'Потврди',
    noviPoslat: 'Нов код е пратен.',
    posaljiNovi: 'Прати нов код',
    netacan: 'Кодот не е точен или повеќе не важи. Внеси го кодот од најновата порака или прати нов.',
    nalogNijeUcitan: 'Кодот е потврден, но сметката не е вчитана. Провери го интернетот и притисни Потврди повторно.',
    robot: 'Не успеавме да потврдиме дека не си робот. Пробај повторно.',
    sacekaj: 'Почекај една минута пред да побараш нов код.',
    zauzetNaslov: 'Оваа е-пошта веќе има сметка',
    zauzetPodnaslov: (datum, grad) => ({
      pre: 'На сметката ',
      posle: ` има карта за ${datum}, ${grad}. За нова сметка внеси друга е-пошта.`,
    }),
    zauzetNapomena: 'Ако влезеш во постојната сметка, податоците од претходните чекори не се зачувуваат.',
    unesiDrugi: 'Внеси друга е-пошта',
    udjiUTaj: 'Влези во таа сметка',
  },

  poljeZaKod: 'Шестцифрен код',

  captcha: 'Само да потврдиме дека не си робот.',

  ime: {
    naslov: 'Како да те викаме?',
    podnaslov: 'Така хороскопот ти се обраќа директно, наместо како огласна табла.',
    placeholder: 'Твоето име',
  },

  podrazumevanoIme: 'Ти',

  bezInterneta: 'Нема интернет. Прикажано е она што е зачувано на телефонот.',

  promenaEmaila: {
    naslov: 'Промена на е-пошта',
    sadasnja: (stari) => `Сегашната адреса е ${stari}. На новата праќаме код, па се најавуваш со неа.`,
    placeholder: 'Нова адреса на е-пошта',
    upisiKod: (adresa) => `Внеси го кодот што го пративме на ${adresa}.`,
    stariKod: (stari) => `Уште еден чекор: внеси го кодот што го пративме на старата адреса, ${stari}.`,
    potrebanInternet: 'За промена на е-поштата потребен е интернет.',
    posaljiKod: 'Прати код',
    potvrdi: 'Потврди',
    promeniAdresu: 'Смени ја адресата или прати го кодот повторно',
    zauzeta: 'Оваа адреса веќе има сметка. Внеси друга.',
    upravoPoslat: 'Кодот штотуку е пратен. Почекај една минута и пробај повторно.',
    netacan: 'Кодот не е точен или е истечен. Провери го или побарај нов.',
    nemaVeze: 'Нема врска со серверот. Пробај кога ќе се врати интернетот.',
    nijeUspela: (razvoj) => `Промената не успеа. Пробај повторно за една минута.${razvoj}`,
  },

  nalog: {
    naslov: 'Сметка',
    imeIPrijava: 'Име и најава',
    ime: 'Име',
    email: 'Е-пошта',
    nacinPrijave: 'Начин на најава',
    nacin: {
      email: 'Код на е-пошта',
      apple: 'Apple сметка',
      google: 'Google сметка',
    } as Record<string, string>,
    nalogOd: 'Сметка отворена',
    podaciORodjenju: 'Податоци за раѓање',
    datumRodjenja: 'Датум на раѓање',
    vremeRodjenja: 'Време на раѓање',
    neZnam: 'Не знам',
    mestoRodjenja: 'Место на раѓање',
    /** Pominje natpis reda `vremeRodjenja`, pod navodnicima. */
    bezVremena: 'Без време на раѓање подзнакот и куќите не се сигурни. Допри „Време на раѓање“ за да го додадеш.',
    odjavaSvuda: 'Одјави се од сите уреди',
    odjavaNaslov: 'Да се одјавиш од сите уреди?',
    odjavaTekst: 'Ќе бидеш одјавен и на овој телефон и на секој друг уред на кој си најавен.',
    odustani: 'Откажи',
    odjaviSeSvuda: 'Одјави се насекаде',
    brisanjeNaslov: 'Бришење на сметката',
    brisanjeTekst: 'Трајно ги брише сметката, податоците за раѓање, сликата и прашањата до астрологот. Претплатата не се откажува сама.',
    obrisiNalog: 'Избриши ја сметката',
    obrisatiNaslov: 'Да се избрише сметката?',
    obrisatiTekst:
      'Се бришат сметката, името, сликата и сите податоци за раѓање. Ова не може да се поништи.\n\n' +
      'Претплатата со ова НЕ се откажува — ја откажуваш во поставките на Apple или Google сметката.',
    nijeUspelo: 'Не успеа',
    nijeObrisan: 'Сметката не е избришана. Провери го интернетот и пробај повторно.',
  },

  push: {
    naslov: 'Да не го пропуштиш својот ден',
    podnaslov: 'Еднаш наутро, со хороскопот за тој ден, и кога астрологот ќе ти одговори. Ништо друго не ти праќаме.',
    podnaslovWeb: 'Известувањата работат на телефонот; на веб овој чекор го прескокнуваме.',
    ukljuci: 'Вклучи известувања',
    primerDanNaslov: 'Твојот ден',
    primerDanTekst: 'Хороскопот за денес е подготвен.',
    /** "Венера е во тригон со твоето Сонце." — clan po rodu natalne planete. */
    primerAspektTekst: (tranzitna, aspekt, natalna) => {
      const n = nebo.padeziTela[natalna];
      const clan = n.rod === 'z' ? 'твојата' : n.rod === 's' ? 'твоето' : 'твојот';
      return `${subjekat(nebo.tela[tranzitna])} е во ${nebo.padeziAspekta[aspekt].lokativ} со ${clan} ${n.instrumental}.`;
    },
    primerOdgovorTekst: 'Одговори на твоето прашање.',
    sada: 'сега',
    preSat: '1 ч',
    juce: 'вчера',
  },
};
