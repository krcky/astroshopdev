/**
 * Recenica za DANAS i "Ove nedelje" u oblasti kruga zivota (kartica ispod kruga i list oblasti).
 *
 * SRPSKI (Ivan, 8.10.2026): rečenice po OBLASTI x PLANETI U TRANZITU x TONU iz `i18n/sr/krug-recenice.ts` (PREDLOG, ceka
 * astrologa). Za svaku stavku oblasti (najjaca prva) uzima se rec za njenu tranzitnu planetu i ton; tranziti bez jasnog tona
 * (mesovito) i planete bez recenice (Mesec) se preskacu. "Danas" je prva, "Ove nedelje" druga RAZLICITA. Bez nijedne — neutralna
 * recenica oblasti.
 *
 * DRUGI JEZICI: privremeno kratki tekst najjaceg tranzita (`positive` za povoljan, `challenge` za izazovan) — tekst tranzita
 * govori o tranzitu uopste, ne o oblasti, pa ume da ne pogadja temu. Kad stignu recenice, menja se SAMO ovaj fajl.
 */
import type { KrugOblast } from '@/lib/krug';
import type { TransitText } from '@/lib/transit-texts';
import { jezik } from '@/i18n/jezik';
import { RECENICE_NEUTRALNE, RECENICE_OBLASTI } from '@/i18n/sr/krug-recenice';

type Oblast = Pick<KrugOblast, 'stavke' | 'def'>;

function recenice(oblast: Oblast, texts: Map<string, TransitText>): string[] {
  const sr = jezik() === 'sr';
  const out: string[] = [];
  for (const s of oblast.stavke) {
    if (s.red.kind !== 'tranzit' || s.ton === 'mesovito') continue;
    const r = sr
      ? RECENICE_OBLASTI[`${oblast.def.key}.${s.red.transiting.key}.${s.ton === 'povoljno' ? 'povoljno' : 'izazovno'}`]
      : texts.get(s.red.key)?.[s.ton === 'povoljno' ? 'positive' : 'challenge'];
    if (r && !out.includes(r)) out.push(r);
  }
  return out;
}

export const recenicaOblasti = (oblast: Oblast, texts: Map<string, TransitText>): string | null =>
  recenice(oblast, texts)[0] ?? null;

/** "Ove nedelje" (PRIVREMENO): recenica DRUGOG najjaceg tranzita oblasti; nema je kad je tranzit jedan. */
export const recenicaNedelje = (oblast: Oblast, texts: Map<string, TransitText>): string | null =>
  recenice(oblast, texts)[1] ?? null;

/** Kad oblast nema tranzit sa jasnim tonom: neutralna recenica (samo srpski; drugi jezici koriste recnik). */
export const neutralnaRecenica = (kljuc: string): string | null => (jezik() === 'sr' ? RECENICE_NEUTRALNE[kljuc] ?? null : null);
