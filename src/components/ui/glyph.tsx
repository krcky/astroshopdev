import * as React from 'react';
import { Platform, Text as RNText } from 'react-native';
import { useFonts } from 'expo-font';
import { cn } from '@/lib/utils';

/**
 * Zodijacki i planetarni simboli (♈ ♃ ☽ …).
 *
 * PAZNJA — ovo je cesta zamka: Unicode astroloski znaci imaju podrazumevanu
 * EMOJI prezentaciju, pa ih sistem renderuje kao obojene kvadratice umesto kao
 * tipografske simbole. Resenje je forsiran tekstualni font + U+FE0E.
 *
 * Font je NAS: `assets/fonts/AstroGlyphs.ttf`, sklopljen iz dva Noto izvora
 * (vidi `assets/fonts/POREKLO.md`). Ucitava se ovde, a ne u `_layout.tsx`, da
 * komponenta bude samodovoljna — `useFonts` kesira, pa vise instanci ne znaci
 * vise ucitavanja. Time svi simboli izgledaju isto na svakom telefonu i nestaje
 * rizik od praznog pravougaonika kad sistemski font nema neki znak.
 *
 * REZERVA: dok se font ne ucita — i za znak koji u njemu ne postoji, npr. ako
 * se doda Hiron a font se ne presloži — vracamo se na sistemski simbolicki
 * font umesto da korisnik vidi ▯.
 */
export const GLYPH_FALLBACK = Platform.select({
  ios: 'Apple Symbols',
  android: 'serif',
  web: '"Apple Symbols", "Segoe UI Symbol", "Noto Sans Symbols2", STIXGeneral, serif',
  default: undefined,
});

export const GLYPH_FONT = 'AstroGlyphs';

type GlyphProps = Omit<React.ComponentProps<typeof RNText>, 'children'> & {
  children: string;
  size?: number;
};

export function Glyph({ children, size = 24, className, style, ...props }: GlyphProps) {
  const [ucitan] = useFonts({ AstroGlyphs: require('@/assets/fonts/AstroGlyphs.ttf') });

  return (
    <RNText
      className={cn(className)}
      style={[
        {
          fontFamily: ucitan ? GLYPH_FONT : GLYPH_FALLBACK,
          fontSize: size,
          lineHeight: Math.round(size * 1.25),
        },
        style,
      ]}
      {...props}>
      {children}
    </RNText>
  );
}
