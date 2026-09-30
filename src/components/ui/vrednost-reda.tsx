import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Vrednost desno u redu tabele (`ListRow` `trailing`) — siva, u jednom redu, ne
 * gura naslov. Tabele podataka o rodjenju: "Nalog" i izmena druge osobe (29.9.2026).
 */
export function VrednostReda({ children }: { children: string }) {
  return (
    <View style={{ maxWidth: '55%' }}>
      <Text variant="muted" numberOfLines={1} className="text-right">{children}</Text>
    </View>
  );
}
