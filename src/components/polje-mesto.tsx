import * as React from 'react';
import { Pressable, View } from 'react-native';

import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import type { City } from '@/lib/cities';
import { imeZemlje, useCitySearch } from '@/lib/city-search';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n';

/**
 * Mesto rodjenja: polje za pretragu i predlozi ispod (ugradjena lista pa baza).
 * Izmena svojih podataka (`/edit`), korak nove osobe i list izmene osobe
 * (29.9.2026) — ista pretraga kao u onboardingu.
 *
 * Grad dijaspore nema drzavu u ugradjenoj listi — tada se pise samo ime.
 */
export function PoljeMesto({ grad, onGrad, povrsina, autoFocus, linija = 'border-border', broj = 6 }: {
  grad: City | null;
  onGrad: (g: City | null) => void;
  /** `siva` na beloj povrsini (list, korak), podrazumevano na beloj kartici. */
  povrsina?: 'siva';
  autoFocus?: boolean;
  /** Linija izmedju predloga: na sivoj pozadini `border-fill-strong` (pravilo 17). */
  linija?: 'border-border' | 'border-fill-strong';
  broj?: number;
}) {
  const t = useT().onboarding.pretragaGrada;
  const [upit, setUpit] = React.useState('');
  const { results, loading } = useCitySearch(grad ? '' : upit, broj);
  return (
    <>
      <Input
        povrsina={povrsina}
        value={grad ? (grad.country ? `${grad.name}, ${imeZemlje(grad)}` : grad.name) : upit}
        onChangeText={(v) => { setUpit(v); onGrad(null); }}
        placeholder={t.placeholder}
        autoFocus={autoFocus}
        autoCorrect={false}
      />
      {!grad && (
        <View className="mt-3">
          {results.map((c) => (
            <Pressable
              key={`${c.name}-${c.country}`}
              onPress={() => { onGrad(c); setUpit(''); }}
              accessibilityRole="button"
              className={cn('flex-row items-center justify-between border-b py-3.5 active:opacity-60', linija)}>
              <Text className="text-base">{c.name}</Text>
              <Text variant="muted">{imeZemlje(c)}</Text>
            </Pressable>
          ))}
          {loading && (
            <Text variant="muted" className="py-3 text-center text-sm">{t.trazimDalje}</Text>
          )}
        </View>
      )}
    </>
  );
}
