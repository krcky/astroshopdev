import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Kljucni Reusables pattern: roditelj (Card, Button) postavlja klase za tekst
 * svoje dece kroz context, pa ne moras da prosledjujes className na svaki Text.
 */
export const TextClassContext = React.createContext<string | undefined>(undefined);

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      default: 'text-base',
      display: 'font-serif text-4xl leading-tight tracking-tight',
      h1: 'text-3xl font-semibold tracking-tight',
      h2: 'text-2xl font-semibold tracking-tight',
      h3: 'text-xl font-semibold tracking-tight',
      lead: 'text-lg text-muted-foreground leading-7',
      body: 'text-base leading-7',
      muted: 'text-sm text-muted-foreground',
      label: 'text-xs uppercase tracking-[2px] text-muted-foreground',
      /** Pitanje na vrhu koraka onboardinga — razmaknuti verzali. */
      question: 'text-sm uppercase tracking-[3px] text-foreground text-center',
      /** Sitno objasnjenje iznad dugmeta. */
      note: 'text-sm leading-6 text-muted-foreground text-center',
    },
  },
  defaultVariants: { variant: 'default' },
});

type TextProps = React.ComponentProps<typeof RNText> & VariantProps<typeof textVariants>;

export function Text({ className, variant, ...props }: TextProps) {
  const contextClass = React.useContext(TextClassContext);
  return <RNText className={cn(textVariants({ variant }), contextClass, className)} {...props} />;
}
