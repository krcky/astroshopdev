import * as React from 'react';
import { Platform, Text as RNText } from 'react-native';
import { cn } from '@/lib/utils';

/**
 * Zodijacki i planetarni simboli (♈ ♃ ☽ …).
 *
 * PAZNJA — ovo je cesta zamka: Unicode astroloski znaci imaju podrazumevanu
 * EMOJI prezentaciju, pa ih sistem renderuje kao obojene kvadratice umesto kao
 * tipografske simbole. Resenje je forsiran tekstualni font + U+FE0E.
 *
 * ZA PRODUKCIJU: ucitaj pravi astroloski font preko expo-font i zameni
 * GLYPH_FONT ispod. Ovo je JEDINO mesto koje tada menjas — zato svi simboli
 * u aplikaciji idu kroz ovu komponentu, nikad direktno kroz <Text>.
 */
export const GLYPH_FONT = Platform.select({
  ios: 'Apple Symbols',
  android: 'serif',
  web: '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols2", STIXGeneral, serif',
  default: undefined,
});

type GlyphProps = Omit<React.ComponentProps<typeof RNText>, 'children'> & {
  children: string;
  size?: number;
};

export function Glyph({ children, size = 24, className, style, ...props }: GlyphProps) {
  return (
    <RNText
      className={cn(className)}
      style={[
        { fontFamily: GLYPH_FONT, fontSize: size, lineHeight: Math.round(size * 1.25) },
        style,
      ]}
      {...props}>
      {children}
    </RNText>
  );
}
