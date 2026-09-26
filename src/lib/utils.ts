import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/*
 * tailwind-merge mora da ZNA nase klase, inace ih svrsta u pogresnu grupu.
 *
 * Konkretna greska koja je ovo iznudila: `text-button` (velicina slova) je bez
 * ovog spiska prepoznat kao BOJA teksta, pa je u `cn('text-primary-foreground',
 * 'text-button')` pobedio kao poslednji i pojeo belu boju — natpis na crnom
 * dugmetu je ispao crn na crnom. Svaki kljuc koji dodamo u `tailwind.config.js`
 * mora da se pojavi i ovde.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'tab', 'caption', 'meta', 'chip', 'body',
            'group', 'row', 'nav', 'button', 'section', 'title',
          ],
        },
      ],
      rounded: [{ rounded: ['pill', 'tile', 'bubble'] }],
      h: [{ h: ['button', 'button-compact', 'field', 'row', 'chip', 'tile', 'header-button'] }],
      w: [{ w: ['tile', 'header-button'] }],
      'min-h': [{ 'min-h': ['row', 'button'] }],
      p: [{ p: ['screen', 'gutter'] }],
      px: [{ px: ['screen', 'gutter'] }],
      py: [{ py: ['screen', 'gutter'] }],
      m: [{ m: ['screen', 'gutter'] }],
      mx: [{ mx: ['screen', 'gutter'] }],
      my: [{ my: ['screen', 'gutter'] }],
      ml: [{ ml: ['screen', 'gutter'] }],
      mr: [{ mr: ['screen', 'gutter'] }],
      mt: [{ mt: ['screen', 'gutter'] }],
      mb: [{ mb: ['screen', 'gutter'] }],
      gap: [{ gap: ['screen', 'gutter'] }],
    },
  },
});

/** Spaja Tailwind klase i resava konflikte (poslednja pobedjuje). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
