import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { blokovi } from '@/lib/tumacenje';

/**
 * Pasusi i liste teksta astrologa (duga verzija tranzita, lunarni kalendar).
 * Stavka je "• Naslov – tekst": bullet i tekst obicni, naslov do prve crte
 * podebljan (Ivan, 27.9.2026). Oblik pravi izvoz korpusa, a deli ga
 * `lib/tumacenje.ts`.
 */
export function TumacenjeTekst({ tekst }: { tekst: string }) {
  return (
    <View className="gap-3">
      {blokovi(tekst).map((b, i) =>
        b.vrsta === 'pasus' ? (
          <Text key={i} variant="body">{b.tekst}</Text>
        ) : (
          <View key={i} className="gap-2">
            {b.stavke.map((s, j) => (
              <View key={j} className="flex-row">
                <Text variant="body" className="w-4">•</Text>
                <Text variant="body" className="flex-1">
                  {s.naslov ? (
                    <>
                      <Text variant="body" className="font-semibold text-foreground">{s.naslov}</Text>
                      {' – '}
                    </>
                  ) : null}
                  {s.tekst}
                </Text>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}
