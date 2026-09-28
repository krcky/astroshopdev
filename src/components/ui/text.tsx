import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Kljucni Reusables pattern: roditelj (Card, Button) postavlja klase za tekst
 * svoje dece kroz context, pa ne moras da prosledjujes className na svaki Text.
 */
export const TextClassContext = React.createContext<string | undefined>(undefined);

/*
 * Tipografska skala je izmerena iz snimaka referentne aplikacije — vidi
 * `src/theme/tokens.ts`. Pismo je SISTEMSKO (SF Pro na iOS-u, Roboto na
 * Androidu): `fontFamily` se nigde ne postavlja, a debljina ide obicnim
 * Tailwind klasama za tezinu.
 */
const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      /* --- skala referentne aplikacije ------------------------------- */
      /** Tekuci tekst. Podrazumevano crn; opis ide kroz `body`. */
      default: 'text-body',
      /** Najveci naslov u praznom stanju ekrana. */
      title: 'text-title font-bold tracking-[-0.2px]',
      /** Naslov sekcije unutar liste. */
      section: 'text-section font-bold tracking-[-0.2px]',
      /** Naslov u navigacionoj traci. */
      nav: 'text-nav font-semibold',
      /** Naslov reda ili kartice. */
      row: 'text-row font-medium',
      /** Opis ispod naslova — siv, kao u referentnoj aplikaciji. */
      body: 'text-body text-muted-foreground',
      /**
       * Tekst tumacenja — duzi pasusi koji se CITAJU (tranzit, natal, lunarni).
       * 17pt kao iOS body, prored 26 (Ivan, 28.9.2026: "malo veci tekst na tumacenju").
       */
      reading: 'text-row leading-[26px] text-muted-foreground',
      /** Naslov grupe iznad kartica ("Preferences"). Siv, BEZ verzala. */
      label: 'text-group font-medium text-subtle',
      /** Natpis u kapsuli kategorije. */
      chip: 'text-chip font-medium',
      /** Meta podatak uz stavku: vreme, mesto, broj. */
      muted: 'text-meta text-muted-foreground',
      /** Sitan podnaslov ispod imena. */
      caption: 'text-caption text-muted-foreground',
      /** Natpis ispod ikone u lebdecoj traci. */
      tab: 'text-tab font-medium text-subtle',

      /* --- nasledjene varijante ------------------------------------- */
      /** Veliki naslov koraka onboardinga. Referentna aplikacija ga nema,
       *  ali nas onboarding stoji na njemu — zato ostaje, samo u Inter-u. */
      display: 'text-[32px] leading-[38px] font-bold tracking-[-0.6px]',
      h1: 'text-title font-bold tracking-[-0.2px]',
      h2: 'text-section font-bold tracking-[-0.2px]',
      h3: 'text-row font-semibold',
      lead: 'text-body text-muted-foreground',
      /** Pitanje na vrhu koraka onboardinga. */
      question: 'text-group font-medium text-subtle text-center',
      /** Sitno objasnjenje iznad dugmeta. */
      note: 'text-meta text-muted-foreground text-center',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextProps = React.ComponentProps<typeof RNText> & VariantProps<typeof textVariants>;

export function Text({ className, variant, ...props }: TextProps) {
  const contextClass = React.useContext(TextClassContext);
  return <RNText className={cn(textVariants({ variant }), contextClass, className)} {...props} />;
}

export { textVariants };
