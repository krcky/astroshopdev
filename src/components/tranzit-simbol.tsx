import * as React from 'react';
import { View } from 'react-native';
import { Crown } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { Glyph } from '@/components/ui/glyph';
import { cn } from '@/lib/utils';
import { neutral } from '@/theme/tokens';

/** Uglovi nisu u astroloskom fontu — obicnim slovima (vidi CLAUDE.md). */
export const UGAO: Record<string, string> = { ascendant: 'Asc', midheaven: 'MC' };

/**
 * Simbol tela ili ugla u kruzicu, sa krunicom kad je vladar horoskopa — ista
 * oznaka vladara kao u listu "Na osnovu cega" kartice "Tvoj dan"
 * (`app/tvoj-dan-info.tsx`), samo manja, za red na ekranu "Tranziti".
 */
export function TranzitSimbol({ glyph, pointKey, vladar = false }: {
  glyph: string;
  /** Kljuc tacke — za `ascendant` i `midheaven` crta se tekst umesto znaka. */
  pointKey?: string;
  vladar?: boolean;
}) {
  const ugao = pointKey ? UGAO[pointKey] : undefined;
  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-fill">
      {ugao ? <Text variant="caption" className="font-semibold text-foreground">{ugao}</Text>
        : <Glyph size={16} className="text-foreground">{glyph}</Glyph>}
      {vladar && (
        <View className={cn('absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full border border-border bg-background')}>
          <Crown size={9} color={neutral.ink} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}
