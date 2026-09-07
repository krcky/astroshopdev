/**
 * Kratke osobine po suncevom znaku — prikazuju se na ekranu "velika trojka".
 *
 * PRIVREMENO: ovo su moje formulacije da bi ekran radio. Treba ih zameniti
 * tekstom astrologa. To je mali, zaokruzen posao (12 znakova x 3 reda) i
 * ODVOJEN je od korpusa od 800 strana — moze da stigne mnogo pre njega.
 *
 * Ako kasnije budemo hteli da osobine zavise i od Meseca i ascendenta,
 * kljuc postaje `sun.leo` / `moon.pisces` / `asc.gemini` i tabela raste na 36.
 */
export const SUN_TRAITS: Record<string, [string, string, string]> = {
  aries:       ['Kreće prvi', 'Ne ume da čeka', 'Ljuti se glasno, prašta brzo'],
  taurus:      ['Ne žuri', 'Traži sigurnost', 'Teško se pomera kad se ukopa'],
  gemini:      ['Brzo shvata', 'Menja temu', 'Zna sve pomalo'],
  cancer:      ['Oseća unapred', 'Traži utehu', 'Oprašta ali ne zaboravlja'],
  leo:         ['Traži da se vidi', 'Velikodušan', 'Ne podnosi da ga preskoče'],
  virgo:       ['Primećuje detalj', 'Popravlja tuđe', 'Strog prema sebi'],
  libra:       ['Traži ravnotežu', 'Izbegava sukob', 'Teško se odlučuje'],
  scorpio:     ['Ide do kraja', 'Ne veruje odmah', 'Pamti sve'],
  sagittarius: ['Traži smisao', 'Kaže naglas', 'Teško ostaje na mestu'],
  capricorn:   ['Gradi polako', 'Ozbiljan pre vremena', 'Ne traži pomoć'],
  aquarius:    ['Vidi drugačije', 'Drži distancu', 'Ne podnosi pravila'],
  pisces:      ['Upija tuđe', 'Beži u maštu', 'Zna a ne ume da objasni'],
};

export function traitsForSign(signKey: string): [string, string, string] {
  return SUN_TRAITS[signKey] ?? ['Jedinstven', 'U pokretu', 'Tek se otkriva'];
}
