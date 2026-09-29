import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/**
 * Polje za unos: ISPUNJENA KAPSULA, ne linija i ne okvir (Ivan, 29.9.2026:
 * "polja za unos da ne budu linija").
 *
 * Referentna aplikacija nema nijedno polje sa ivicom — svako je siva kapsula
 * (#F5F5F5) visine 48pt, bez okvira i bez promene izgleda u fokusu. Kursor je
 * jedini znak da je polje aktivno. Ivica bi ovde bila druga linija na ekranu
 * koji ih inace skoro nema.
 *
 * `povrsina` kaze NA CEMU polje stoji, jer se boja obrce:
 *   'bela' (podrazumevano) — na beloj kartici ili listu odozdo: siva kapsula,
 *                            tacno kao na referentnim snimcima
 *   'siva'                 — direktno na sivoj pozadini ekrana (koraci
 *                            onboardinga): BELA kapsula. Siva #F5F5F5 na #F6F7F8
 *                            se ne vidi — isto pravilo kao bela kartica na sivom
 *                            (pravilo 17).
 */
type Props = React.ComponentProps<typeof TextInput> & { povrsina?: 'bela' | 'siva' };

export const Input = React.forwardRef<TextInput, Props>(function Input(
  { className, povrsina = 'bela', ...props },
  ref,
) {
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={neutral.inkSubtle}
      className={cn(
        'h-field rounded-pill px-5 font-sans text-row text-foreground',
        povrsina === 'siva' ? 'bg-card' : 'bg-input',
        className
      )}
      {...props}
    />
  );
});
