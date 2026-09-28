import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * Polje za unos: ISPUNJENO, ne ocrtano.
 *
 * Referentna aplikacija nema nijedno polje sa ivicom — svako je siva kapsula
 * (#F5F5F5) visine 48pt, bez okvira i bez promene izgleda u fokusu. Kursor je
 * jedini znak da je polje aktivno. Ivica bi ovde bila druga linija na ekranu
 * koji ih inace skoro nema.
 */
export function Input({ className, ...props }: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={neutral.inkSubtle}
      className={cn(
        'h-field rounded-pill bg-input px-5 font-sans text-row text-foreground',
        className
      )}
      {...props}
    />
  );
}
