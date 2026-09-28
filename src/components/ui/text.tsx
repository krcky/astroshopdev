import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { fontFamilyZaKlase } from '@/theme/font';
import { tezina } from '@/theme/tipografija';

/**
 * Kljucni Reusables pattern: roditelj (Card, Button) postavlja klase za tekst
 * svoje dece kroz context, pa ne moras da prosledjujes className na svaki Text.
 */
export const TextClassContext = React.createContext<string | undefined>(undefined);

/*
 * Tipografska skala je izmerena iz snimaka referentne aplikacije — vidi
 * `src/theme/tokens.ts`. Pismo je SATOSHI (Ivan, 28.9.2026; `theme/font.ts`):
 * debljina svake varijante je u `theme/tipografija.ts` (jedno mesto za celu
 * hijerarhiju), a `Text` iz klase tezine bira familiju — Regular, Medium, Bold.
 */
const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      /* --- skala referentne aplikacije ------------------------------- */
      /** Tekuci tekst. Podrazumevano crn; opis ide kroz `body`. */
      default: cn('text-body', tezina('default')),
      /** Najveci naslov u praznom stanju ekrana. */
      title: cn('text-title tracking-[-0.2px]', tezina('title')),
      /** Naslov sekcije unutar liste. */
      section: cn('text-section tracking-[-0.2px]', tezina('section')),
      /** Naslov u navigacionoj traci. */
      nav: cn('text-nav', tezina('nav')),
      /** Naslov reda ili kartice. */
      row: cn('text-row', tezina('row')),
      /** Opis ispod naslova — siv, kao u referentnoj aplikaciji. */
      body: cn('text-body text-muted-foreground', tezina('body')),
      /**
       * Tekst tumacenja — duzi pasusi koji se CITAJU (tranzit, natal, lunarni).
       * 17pt kao iOS body, prored 26 (Ivan, 28.9.2026: "malo veci tekst na tumacenju").
       */
      reading: cn('text-row leading-[26px] text-muted-foreground', tezina('reading')),
      /** Naslov grupe iznad kartica ("Preferences"). Siv, BEZ verzala. */
      label: cn('text-group text-subtle', tezina('label')),
      /** Natpis u kapsuli kategorije. */
      chip: cn('text-chip', tezina('chip')),
      /** Meta podatak uz stavku: vreme, mesto, broj. */
      muted: cn('text-meta text-muted-foreground', tezina('muted')),
      /** Sitan podnaslov ispod imena. */
      caption: cn('text-caption text-muted-foreground', tezina('caption')),
      /**
       * Oznaka verzalom iznad naslova: ime tranzita na kartici i listu, datum na
       * "Tvom danu", oblasti u "Danas ukratko" (Ivan, 28.9.2026). 11pt, siva,
       * razmak slova 4% (0,44 na 11pt — preracunati ako se menja velicina).
       */
      oznaka: cn('text-[11px] leading-[15px] uppercase tracking-[0.44px] text-muted-foreground', tezina('karticaOznaka')),
      /** Natpis ispod ikone u lebdecoj traci. */
      tab: cn('text-tab text-subtle', tezina('tab')),

      /* --- nasledjene varijante ------------------------------------- */
      /** Veliki naslov koraka onboardinga. Referentna aplikacija ga nema,
       *  ali nas onboarding stoji na njemu — zato ostaje, samo u Inter-u. */
      display: cn('text-[32px] leading-[38px] tracking-[-0.6px]', tezina('display')),
      h1: cn('text-title tracking-[-0.2px]', tezina('title')),
      h2: cn('text-section tracking-[-0.2px]', tezina('section')),
      h3: cn('text-row', tezina('h3')),
      lead: cn('text-body text-muted-foreground', tezina('lead')),
      /** Pitanje na vrhu koraka onboardinga. */
      question: cn('text-group text-subtle text-center', tezina('question')),
      /** Sitno objasnjenje iznad dugmeta. */
      note: cn('text-meta text-muted-foreground text-center', tezina('note')),
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextProps = React.ComponentProps<typeof RNText> & VariantProps<typeof textVariants>;

export function Text({ className, variant, style, ...props }: TextProps) {
  const contextClass = React.useContext(TextClassContext);
  const klase = cn(textVariants({ variant }), contextClass, className);
  // Ucitano pismo: debljina je familija, ne `fontWeight` (vidi `theme/font.ts`).
  return (
    <RNText
      className={klase}
      style={[{ fontFamily: fontFamilyZaKlase(klase), fontWeight: 'normal' }, style]}
      {...props}
    />
  );
}

export { textVariants };
