import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { FONT } from '@/theme/font';

/**
 * Polje za unos: ISPUNJENA KAPSULA, ne linija i ne okvir (Ivan, 29.9.2026:
 * "polja za unos da ne budu linija").
 *
 * Referentna aplikacija nema nijedno polje sa ivicom — svako je siva kapsula
 * (#F5F5F5) visine 48pt, bez okvira. Ivica bi ovde bila druga linija na ekranu
 * koji ih inace skoro nema — zato je nema dok se ne kuca.
 *
 * AKTIVNO STANJE (Ivan, 29.9.2026: "neko aktivno stanje kad se kuca"): dok je
 * polje u fokusu, kapsula je BELA sa obodom od 1pt u boji teksta (`--ring`) —
 * na obe povrsine isto, pa polje u koje se kuca izgleda jednako svuda. Do tada je
 * kursor bio jedini znak, kao u referenci. Isto stanje ima i polje za kod
 * (`code.tsx`). Obod postoji i van fokusa, samo providan: da se pojavljuje,
 * tekst bi pri dodiru skocio za 1pt.
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
  { className, povrsina = 'bela', onFocus, onBlur, ...props },
  ref,
) {
  const [fokus, setFokus] = React.useState(false);
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={neutral.inkSubtle}
      // Kursor u boji oboda (i teksta), kao u polju za kod — sistemski je bio lila.
      selectionColor={neutral.ink}
      cursorColor={neutral.ink}
      onFocus={(e) => { setFokus(true); onFocus?.(e); }}
      onBlur={(e) => { setFokus(false); onBlur?.(e); }}
      className={cn(
        'h-field rounded-pill border px-5 font-sans text-row text-foreground',
        povrsina === 'siva' ? 'bg-card' : 'bg-input',
        fokus ? 'border-ring bg-card' : 'border-transparent',
        className
      )}
      {...props}
      // `font-sans` je Jakarta; pismo tekuceg jezika (makedonski = Manrope, `theme/font.ts`).
      style={[{ fontFamily: FONT.regular }, props.style]}
    />
  );
});
