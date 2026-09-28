import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';
import { blokovi } from '@/lib/tumacenje';
import { tezina } from '@/theme/tipografija';
import { cn } from '@/lib/utils';

/**
 * Pasusi i liste teksta astrologa (duga verzija tranzita, lunarni kalendar).
 * Stavka je "• Naslov – tekst": naslov do prve crte podebljan u svom redu,
 * tekst ispod (Ivan, 27. i 28.9.2026). Oblik pravi izvoz korpusa, a deli ga
 * `lib/tumacenje.ts`.
 */
export function TumacenjeTekst({ tekst }: { tekst: string }) {
  return (
    <View className="gap-3">
      {blokovi(tekst).map((b, i) =>
        b.vrsta === 'pasus' ? (
          <Text key={i} variant="reading">{b.tekst}</Text>
        ) : (
          <View key={i} className="gap-2">
            {b.stavke.map((s, j) => (
              <View key={j} className="flex-row">
                <Text variant="reading" className="w-5">•</Text>
                {/* Naslov stavke u SVOM redu, tekst ispod — ne u istom <Text>-u.
                    Podebljan deo usred reda + prored 26 iOS pogresno meri: poslednja
                    rec se odsece na ivici, a ispod ostane prazan red (Ivan, snimak
                    28.9.2026, "Nepotpuni podaci"). Bez ugnezdenog teksta nema ni greske. */}
                <View className="flex-1">
                  {!!s.naslov && <Text variant="reading" className={cn('text-foreground', tezina('naslovStavke'))}>{s.naslov}</Text>}
                  <Text variant="reading">{s.tekst}</Text>
                </View>
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  );
}
