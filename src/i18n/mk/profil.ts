import type { Recnik } from '../sr';
import { gramatika, mnozina } from './gramatika';

/** "10 особи", "1 особа" (бр. "до 10 особи"). */
const osobaBroj = (n: number) => `${n} ${mnozina(n, 'особа', 'особи')}`;

/** Recenica "ko vidi podatke" — ista u izmeni osobe i u pregledu nove osobe. */
const vidisSamoTi = (astrolog: string) =>
  `Овие податоци ги гледаш само ти. Ако поставиш прашање за оваа особа, ги гледа и ${astrolog}.`;

/**
 * Prevod `sr/profil.ts` (makedonski): profil, Premium (paywall, katanci) i druge osobe.
 * "Premium" ostaje latinicom — ime paketa u prodavnici (kao "Astro Shop").
 */
export const profil: Recnik['profil'] = {
  profil: {
    dodajSliku: 'Додај профилна слика',
    promeniSliku: 'Промени ја или отстрани ја профилната слика',
    slikaProfila: 'Профилна слика',
    izaberiDruguSliku: 'Избери друга слика',
    ukloniSliku: 'Отстрани ја сликата',
    odustani: 'Откажи',
    nemaPristupaNaslov: 'Нема пристап до фотографиите',
    nemaPristupaTekst: 'Дозволи пристап во поставките на телефонот, па обиди се повторно.',
    slikaNijeSacuvanaNaslov: 'Сликата не е зачувана',
    slikaNijeSacuvanaTekst: 'Провери го интернетот, па обиди се повторно.',
    pretplata: 'Претплата',
    test: 'Тест',
    nalog: 'Сметка',
    pravila: 'Правила',
    pomoc: 'Помош',
    pisiteNam: 'Пишете ни',
    obavestenja: 'Известувања',
    obavestenjaUskoro: 'Наскоро',
    nemaMejlAplikacije: (adresa) => `На телефонот нема апликација за е-пошта. Адресата е ${adresa}.`,
    premium: 'Premium',
    ukljucenTestom: 'Вклучен со тест-прекинувач',
    poklon: (istice) => `Подарок${istice ? `, до ${istice}` : ''}`,
    aktivanObnavljaSe: (istice) => `Активен, се обновува на ${istice}`,
    aktivan: 'Активен',
    upravljajPretplatom: 'Управувај со претплатата',
    otkljucajPremium: 'Отклучи Premium',
    otkljucajPremiumIspod: 'Сите транзити, целиот текст и другите денови',
    vratiKupovine: 'Врати купувања',
    josNijeMoguceNaslov: 'Сè уште не е можно',
    josNijeMoguceTekst: 'Купувањето во апликацијата сè уште не е вклучено.',
    nemaPretplateNaslov: 'Нема претплата',
    nemaPretplateTekst: 'На оваа сметка во продавницата нема претплата за Astro Shop.',
    proveraNijeUspelaNaslov: 'Проверката не успеа',
    proveraNijeUspelaTekst: 'Обиди се повторно за момент.',
    placeniKorisnik: 'Корисник со претплата',
    pratiServer: (placen) => `Следи го серверот (${placen ? 'со претплата' : 'бесплатно'})`,
    rucno: 'Рачно, само на овој телефон',
    prekidacOpis: 'Тест-прекинувач: корисник со претплата',
    vratiNaServer: 'Врати на состојбата од серверот',
    jezik: 'Јазик',
    jezikIspod: 'Текстовите на астрологот засега се само на српски.',
    nalogIspod: 'Е-пошта и податоци за раѓање',
    odjaviSe: 'Одјави се',
    pravilaPrivatnosti: 'Правила за приватност',
    usloviKoriscenja: 'Услови за користење',
    verzija: (ime, verzija) => `${ime} ${verzija}`,
  },

  dugmeProfil: 'Профил',

  premium: {
    naslov: 'Отвори ги сите толкувања',
    podnaslov: 'Сите твои транзити, темите на периодот и поглед кон утре и задутре.',
    natalnaNaslov: 'Натална карта',
    natalnaTekst: 'Толкување на секоја планета по знак и куќа и на сите аспекти.',
    tranzitiNaslov: 'Транзити',
    tranzitiTekst: 'Сите транзити на денот со целото толкување — и за утре и задутре.',
    ljudiNaslov: 'Твоите луѓе',
    ljudiTekst: (n) => `Карти и транзити за најмногу ${n} ${mnozina(n, 'блиска особа', 'блиски особи')}.`,
    godisnjeNaslov: 'Годишно',
    godisnje: 'годишно',
    mesecnoNaslov: 'Месечно',
    mesecno: 'месечно',
    poMesecu: (cena) => `${cena} месечно`,
    ustedi: (procenat) => `Заштеди ${procenat}%`,
    nijeUkljucena: 'Купувањето во апликацијата сè уште не е вклучено.',
    kupovinaNijeUspela: 'Купувањето не успеа. Обиди се повторно за момент.',
    kupovinaCeka: 'Купувањето чека одобрување. Premium се вклучува штом тоа ќе стигне.',
    nemaPretplate: 'На оваа сметка во продавницата нема претплата за Astro Shop.',
    proveraNijeUspela: 'Проверката не успеа. Обиди се повторно за момент.',
    probaj: (dana) => `Пробај ${gramatika.dana(dana)} бесплатно`,
    pretplatiSe: 'Претплати се',
    besplatno: (dana) => `${gramatika.dana(dana)} бесплатно`,
    cenaPeriod: (cena, period) => `${cena} ${period}`,
    umesto: (cena) => `наместо ${cena}`,
    obnavljanje: (proba, ios) =>
      (proba ? `По пробниот период ${proba.cena} ${proba.godisnje ? 'годишно' : 'месечно'}. ` : '')
      + `Претплатата се обновува сама додека не ја откажеш во поставките на ${ios ? 'App Store' : 'Google Play'}.`,
    pitanjaPosebno: 'Прашањата до астрологот се плаќаат посебно.',
    uslovi: 'Услови',
    vratiKupovine: 'Врати купувања',
    privatnost: 'Приватност',
    pisteAstrologNaslov: 'Пишува астролог',
    pisteAstrologTekst: (astrolog) => `Сите толкувања ги пишува астрологот ${astrolog}.`,
  },

  zakljucano: {
    red: (naslov) => `${naslov}. Со Premium`,
  },

  tvojiLjudi: {
    naslov: 'Твоите луѓе',
    /** Razmaci oko tacke su NEPRELOMNI. */
    naslovSaBrojem: (n) => `Твоите луѓе  ·  ${n}`,
    redOsobe: (ime, ispod, zakljucana) =>
      `${ime}${ispod ? `, ${ispod}` : ''}${zakljucana ? '. Со Premium' : ''}`,
    dodajOsobu: 'Додај особа',
    dodajOsobuOpis: (ispod) => `Додај особа${ispod ? `. ${ispod}` : ''}`,
    uzPremiumDo: (n) => `Со Premium до ${osobaBroj(n)}`,
    praznoIspod: 'Карта и транзити на партнер, дете или пријател',
  },

  odnosi: {
    partner: 'Партнер',
    dete: 'Дете',
    roditelj: 'Родител',
    brat_sestra: 'Брат или сестра',
    prijatelj: 'Пријател',
    drugo: 'Некој друг',
  },

  greske: {
    granica: 'За повеќе особи потребен е Premium.',
    prijavaIstekla: 'Најавата истече. Затвори ја апликацијата и отвори ја повторно.',
    mreza: 'Нема врска со серверот. Ништо не е зачувано — обиди се кога ќе се врати интернетот.',
    opsta: 'Не е зачувано. Обиди се повторно за една минута.',
  },

  rodjenje: {
    ime: 'Име',
    /** "Што ти е" = koji ti je odnos — bez roda (za razliku od "Кој/Која"). */
    koTiJeNaslov: 'Што ти е',
    koTiJe: (ime) => `Што ти е ${ime}?`,
    datum: 'Датум на раѓање',
    vreme: 'Време на раѓање',
    mesto: 'Место на раѓање',
    neZnamVreme: 'Не го знам времето',
    imeIliNadimak: 'Име или прекар',
    nemaVise: 'Оваа особа веќе не е на твојата листа.',
  },

  osoba: {
    naslov: 'Особа',
    tabKarta: 'Натална карта',
    tabTranziti: 'Транзити',
    tabPitaj: 'Прашај',
    uzPremium: (ime) => `${ime} се отклучува со Premium`,
    uzPremiumOpis: (n) =>
      `Без Premium отворена е само првата особа на листата. Со него имаш карти и транзити за најмногу ${osobaBroj(n)}.`,
    otkljucajSve: 'Отклучи ги сите особи',
    tranzitiNeMogu: 'Транзитите не можат да се пресметаат',
    tranzitiNeMoguTekst: (grad) =>
      `За местото ${grad} на тој датум не знаеме сигурно колку часот било според UTC, па ни картата ни транзитите на неа не би биле точни.`,
    izmeniOpis: 'Уреди ги податоците за раѓање',
    pitajAstrologa: 'Прашај астролог',
    pitajTekst: (astrolog) => `${astrolog} ја гледа оваа карта, па можеш да прашаш за оваа особа или за вас двајцата.`,
    postaviPitanje: 'Постави прашање',
  },

  osobaUredi: {
    naslov: 'Уредување',
    obrisatiNaslov: 'Да се избрише особата?',
    obrisatiTekst: (ime) =>
      `${ime} исчезнува од твојата листа, на сите уреди. Веќе поставените прашања за оваа особа остануваат.`,
    odustani: 'Откажи',
    nijeIzabrano: 'Не е избрано',
    neZnaSe: 'Не се знае',
    napomena: (astrolog, bezVremena) =>
      (bezVremena ? 'Без време на раѓање картата нема подзнак ни куќи. ' : '') + vidisSamoTi(astrolog),
    obrisiOsobu: 'Избриши ја особата',
  },

  rodjenjePolje: {
    trebaInternet: 'За измена потребен е интернет.',
    tvojeIme: 'Твоето име',
    vremeNijeUneto: 'Времето не е внесено — картата нема подзнак ни куќи.',
    znamVreme: 'Го знам времето, сакам да го внесам',
  },

  novaOsoba: {
    napomena: 'Податоците за раѓање ги гледаш само ти. Не ги споделуваме и не ги продаваме.',
    imeNaslov: 'Како се вика?',
    imePodnaslov: 'Име или прекар — го гледаш само ти.',
    izaberiDatum: 'Избери датум',
    izaberiVreme: 'Избери време',
    vremePodnaslov: 'Без време картата нема подзнак ни куќи.',
    neMozemoKartu: 'Не можеме да ја пресметаме картата',
    neMozemoKartuTekst: (grad, zona) =>
      `Не знаеме сигурно колку часот било според UTC во местото ${grad} на тој датум. Пробај друго место на раѓање или јави ни — зона: ${zona}`,
    nazadNaMesto: 'Назад на местото на раѓање',
    datumUVreme: (datum, vreme) => `${datum} во ${vreme}`,
    vidisSamoTi,
    trebaInternet: 'За додавање особа потребен е интернет.',
    dodajOsobu: 'Додај особа',
    potvrdiPristanak: 'Потврди ја согласноста',
    sunce: 'Сонце',
    mesec: 'Месечина',
    podznak: 'Подзнак',
    ulogaZnak: (uloga, znak) => `${uloga}: ${znak ?? 'непознат'}`,
    bezVremena: 'Без време на раѓање подзнакот и куќите не можат да се пресметаат. Времето можеш да го додадеш подоцна.',
    pristanak: 'Особата знае дека ги внесувам нејзините податоци за раѓање. Ако е дете, јас сум родител или старател.',
  },
};
