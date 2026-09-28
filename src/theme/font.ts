/**
 * PISMO: Plus Jakarta Sans (Ivan, 28.9.2026) — umesto Satoshija, koji je
 * istog dana zamenio sistemsko (SF Pro / Roboto).
 *
 * Fajlovi su u `assets/fonts/plus-jakarta-sans/`, staticki rezovi iz Google
 * Fonts paketa, neizmenjeni. Licenca je SIL OFL 1.1 (`OFL.txt` pored fontova):
 * ugradnja u aplikaciju je slobodna, uz licencu. Proveren skup znakova u sva tri
 * reza: č ć š ž đ (i velika), „ " – — · ± … ° i cifre — svi postoje. Cifre su
 * siroke kao Satoshijeve (~0,6 em), pa mere na tocku (`lib/wheel.ts`) vaze.
 *
 * TRI DEBLJINE, SVAKA KAO SVOJA FAMILIJA. Sa ucitanim fontom React Native ne
 * bira debljinu po `fontWeight`: Android bi jednu familiju vestacki podebljao,
 * iOS bi ostao na istoj. Zato `<Text>` iz klase tezine (`font-semibold`…) bira
 * familiju (`fontFamilyZaKlase`) i vraca `fontWeight` na normal.
 * PET REZOVA (Ivan, 28.9.2026: "svi su iste debljine"): Regular, Medium,
 * SemiBold, Bold, ExtraBold. Sa tri reza hijerarhija se nije videla — tekst je
 * Medium, sve iznad njega Bold, a Jakartin Medium i Bold su blizi nego
 * Satoshijevi. Koja uloga nosi koji rez: `theme/tipografija.ts`.
 *
 * POVRATAK NA SATOSHI: `FONT = FONT_SATOSHI` i u `FONT_FILES` fajlovi iz
 * `assets/fonts/satoshi/`, plus `fontFamily.sans` u `tailwind.config.js`.
 *
 * Astroloski simboli i dalje idu kroz `<Glyph>` i svoj font (pravilo 3).
 */
export const FONT = {
  regular: 'PlusJakartaSans-Regular',
  medium: 'PlusJakartaSans-Medium',
  semibold: 'PlusJakartaSans-SemiBold',
  bold: 'PlusJakartaSans-Bold',
  extrabold: 'PlusJakartaSans-ExtraBold',
} as const;

/**
 * Prethodno pismo (28.9.2026), za povratak — vidi gore; uz njega i
 * `TEZINE = TEZINE_SATOSHI`. Satoshi ima samo tri reza, pa 600 i 800 padaju na Bold.
 */
export const FONT_SATOSHI = {
  regular: 'Satoshi-Regular',
  medium: 'Satoshi-Medium',
  semibold: 'Satoshi-Bold',
  bold: 'Satoshi-Bold',
  extrabold: 'Satoshi-Bold',
} as const;

/** Za `useFonts` u `app/_layout.tsx` — ime familije -> fajl. */
export const FONT_FILES = {
  [FONT.regular]: require('../../assets/fonts/plus-jakarta-sans/PlusJakartaSans-Regular.ttf'),
  [FONT.medium]: require('../../assets/fonts/plus-jakarta-sans/PlusJakartaSans-Medium.ttf'),
  [FONT.semibold]: require('../../assets/fonts/plus-jakarta-sans/PlusJakartaSans-SemiBold.ttf'),
  [FONT.bold]: require('../../assets/fonts/plus-jakarta-sans/PlusJakartaSans-Bold.ttf'),
  [FONT.extrabold]: require('../../assets/fonts/plus-jakarta-sans/PlusJakartaSans-ExtraBold.ttf'),
};

/** Familija po Tailwind klasi tezine u konacnom nizu klasa (poslednja pobedjuje). */
export function fontFamilyZaKlase(klase: string): string {
  const m = klase.match(/\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g);
  const tezina = m ? m[m.length - 1].slice(5) : 'normal';
  if (tezina === 'medium') return FONT.medium;
  if (tezina === 'semibold') return FONT.semibold;
  if (tezina === 'bold') return FONT.bold;
  if (tezina === 'extrabold' || tezina === 'black') return FONT.extrabold;
  return FONT.regular;
}

/** Za mesta koja tezinu zadaju brojem (SVG tekst, `labelStyle` tabova). */
export function fontFamilyZaTezinu(tezina: string | number | undefined): string {
  const n = Number(tezina ?? 400);
  if (n >= 800) return FONT.extrabold;
  if (n >= 700) return FONT.bold;
  if (n >= 600) return FONT.semibold;
  if (n >= 500) return FONT.medium;
  return FONT.regular;
}
