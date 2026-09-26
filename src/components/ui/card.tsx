import * as React from 'react';
import { View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Text, TextClassContext } from '@/components/ui/text';

/*
 * Kartica referentne aplikacije: BELA, poluprecnika 24, bez senke.
 *
 * Stoji na SIVOJ pozadini ekrana (`bg-grouped`) — razdvaja ih razlika u boji,
 * pa joj ivica ne treba. "Pozadina ekrana je siva, kartice su bele. Obrnuto ne
 * radi." (`ui/list.tsx`)
 *
 * DVE stvari koje izgledaju kao ukras a nose efekat vrha ekrana:
 *
 * `bg-card/80` — ispuna je bela na 80%, ne puna bela. Preliv na vrhu ekrana
 * stoji IZNAD kartice, a sivo ispod nje se probija kroz tih 20%. Zbog toga
 * kartica koja prolazi kroz preliv poprimi nijansu umesto da ostane mrtvo bela.
 * Sa punom belom efekat postoji, ali je za nijansu tvrdji — referenca je
 * poluprovidna i tako je ovde prepisano.
 *
 * `border-card` — ivica je PUNA bela, dakle svetlija od sopstvene ispune.
 * To je ono sto kartici da ostar rub na sivom; bez nje poluprovidna ispuna
 * na ivici izgleda izlizano.
 */

/** Recept povrsine. Izdvojen da ga mogu koristiti i paneli koji nisu `<Card>`. */
export const CARD_SURFACE = 'rounded-lg border border-card bg-card/80';

const cardVariants = cva('', {
  variants: {
    variant: {
      /** Bela kartica na sivoj pozadini ekrana. */
      default: CARD_SURFACE,
      /** Samo ivica, bez ispune — za retke povrsine na beloj pozadini. */
      outline: 'rounded-lg border border-border',
      /** Bez ivice i bez ispune. */
      plain: 'rounded-lg',
    },
  },
  defaultVariants: { variant: 'default' },
});

type CardProps = React.ComponentProps<typeof View> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, ...props }: CardProps) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <View className={cn(cardVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('gap-1 p-gutter', className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="row" className={cn(className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.ComponentProps<typeof Text>) {
  return <Text variant="body" className={cn(className)} {...props} />;
}

export function CardContent({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('p-gutter pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<typeof View>) {
  return <View className={cn('flex-row items-center p-gutter pt-0', className)} {...props} />;
}

export { cardVariants };
