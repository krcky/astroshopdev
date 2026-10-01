import * as React from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useNaMrezi } from '@/lib/mreza';
import { neutral } from '@/theme/tokens';
import { useT } from '@/i18n';

/**
 * Traka "Nema interneta" na vrhu sadrzaja (Ivan, 29.9.2026). Crta je `Screen` i
 * `SheetScroll`, pa je ekran ne dodaje sam. Bez mreze aplikacija i dalje racuna
 * sve lokalno i pokazuje tekstove sa diska (`kes-na-disku.ts`) — traka samo
 * kaze zasto nekog teksta nema, da prazno mesto ne izgleda kao kvar.
 *
 * Sivo, ne crveno: nista nije pokvareno i nista korisnik ne mora da uradi.
 */
export function BezInterneta({ className }: { className?: string }) {
  const t = useT();
  if (useNaMrezi()) return null;
  return (
    <View
      accessibilityRole="alert"
      className={cn('flex-row items-center gap-2 rounded-lg bg-fill px-4 py-3', className)}>
      <WifiOff size={16} color={neutral.inkMuted} strokeWidth={2} />
      <Text variant="muted" className="flex-1">{t.onboarding.bezInterneta}</Text>
    </View>
  );
}
