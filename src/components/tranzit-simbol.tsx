import * as React from 'react';
import { View } from 'react-native';
import { Crown } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';
import { tezina } from '@/theme/tipografija';
import { PlanetaIkona, imaIkonu } from '@/components/planeta-ikona';

/** Uglovi nisu u astroloskom fontu — obicnim slovima (vidi CLAUDE.md). */
export const UGAO: Record<string, string> = { ascendant: 'Asc', midheaven: 'MC' };

/**
 * Simbol tela ili ugla u kruzicu, sa krunicom kad je vladar horoskopa — ista
 * oznaka vladara kao u listu "Na osnovu cega" kartice "Tvoj dan"
 * (`app/tvoj-dan-info.tsx`), samo manja, za red na ekranu "Tranziti".
 *
 * Kad za tacku postoji Ivanova ikonica (`planeta-ikona.tsx`, 28.9.2026) crta
 * se ona — crn krug sa belim znakom; znak iz fonta ostaje rezerva.
 */
export function TranzitSimbol({ glyph, pointKey, vladar = false, size = 32 }: {
  glyph: string;
  /** Kljuc tacke (`sun`, `ascendant`…) — bira ikonicu; bez nje znak iz fonta ili "Asc"/"MC". */
  pointKey?: string;
  vladar?: boolean;
  /** Precnik kruga. Na tabu "Tranziti" 24 (Ivan, 28.9.2026: "smanji krugove"). */
  size?: number;
}) {
  const ugao = pointKey ? UGAO[pointKey] : undefined;
  const ikona = pointKey && imaIkonu(pointKey) ? pointKey : null;
  return (
    <View className={cn('items-center justify-center rounded-full', !ikona && 'bg-fill')} style={{ width: size, height: size }}>
      {ikona ? <PlanetaIkona planeta={ikona} size={size} />
        : ugao ? <Text variant="caption" className={cn('text-foreground', tezina('ugao'))}>{ugao}</Text>
        : <Glyph size={16} className="text-foreground">{glyph}</Glyph>}
      {vladar && (
        <View
          className="absolute items-center justify-center rounded-full border border-border bg-background"
          style={{ width: size / 2, height: size / 2, right: -size / 8, top: -size / 8 }}>
          <Crown size={Math.round(size * 0.28)} color={neutral.ink} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}
