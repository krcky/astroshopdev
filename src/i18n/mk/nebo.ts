import type { Recnik } from '../sr';

/**
 * Imena tela, tacaka, aspekata, znakova i mesecevih faza — vidi `sr/nebo.ts`. Kljucevi se ne prevode.
 * Makedonski NEMA padeza: svi oblici su ime. `rod` ostaje (prisvojni clan: "твојот Марс",
 * "твојата Венера", "твоето Сонце"). Mesec (planeta) je "Месечина" (zenski rod).
 */
const bez = (ime: string) => ({ genitiv: ime, dativ: ime, akuzativ: ime, instrumental: ime, lokativ: ime });
const znak = (ime: string) => ({ ime, akuzativ: ime, lokativ: ime });

const TELA = {
  sun: 'Сонце', moon: 'Месечина', mercury: 'Меркур', venus: 'Венера', mars: 'Марс',
  jupiter: 'Јупитер', saturn: 'Сатурн', uranus: 'Уран', neptune: 'Нептун', pluto: 'Плутон',
};
const ASPEKTI = { conjunction: 'конјункција', sextile: 'секстил', square: 'квадрат', trine: 'тригон', opposition: 'опозиција' };

const znaci: Recnik['nebo']['znaci'] = {
  aries: znak('Овен'), taurus: znak('Бик'), gemini: znak('Близнаци'), cancer: znak('Рак'),
  leo: znak('Лав'), virgo: znak('Девица'), libra: znak('Вага'), scorpio: znak('Скорпија'),
  sagittarius: znak('Стрелец'), capricorn: znak('Јарец'), aquarius: znak('Водолија'), pisces: znak('Риби'),
};

/**
 * Ime tela kao SUBJEKAT recenice: Сонце i Месечина kao nebeska tela nose clan ("Сонцето влегува
 * во Вага", "Месечината е во Рак"); planete su imena i ostaju bez clana ("Марс е во Бик").
 */
export const subjekat = (ime: string): string =>
  ime === TELA.sun ? 'Сонцето' : ime === TELA.moon ? 'Месечината' : ime;

export const nebo: Recnik['nebo'] = {
  tela: TELA,
  tacke: { northNode: 'Северен јазол', lilith: 'Лилит', fortune: 'Точка на среќата' },
  aspekti: ASPEKTI,
  padeziTela: {
    sun: { rod: 's', ...bez(TELA.sun) }, moon: { rod: 'z', ...bez(TELA.moon) },
    mercury: { rod: 'm', ...bez(TELA.mercury) }, venus: { rod: 'z', ...bez(TELA.venus) },
    mars: { rod: 'm', ...bez(TELA.mars) }, jupiter: { rod: 'm', ...bez(TELA.jupiter) },
    saturn: { rod: 'm', ...bez(TELA.saturn) }, uranus: { rod: 'm', ...bez(TELA.uranus) },
    neptune: { rod: 'm', ...bez(TELA.neptune) }, pluto: { rod: 'm', ...bez(TELA.pluto) },
  },
  padeziAspekta: {
    conjunction: bez(ASPEKTI.conjunction), sextile: bez(ASPEKTI.sextile), square: bez(ASPEKTI.square),
    trine: bez(ASPEKTI.trine), opposition: bez(ASPEKTI.opposition),
  },
  znaci,
  /** "во Лав" — kade e nesto i kade odi (makedonski nema razlika). */
  uZnaku: (k) => `во ${znaci[k].ime}`,
  uZnak: (k) => `во ${znaci[k].ime}`,
  fazeMeseca: [
    'Млада Месечина', 'Млад срп', 'Прва четвртина', 'Растечка Месечина',
    'Полна Месечина', 'Опаѓачка Месечина', 'Последна четвртина', 'Стар срп',
  ],
};
