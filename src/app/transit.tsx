import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Lock } from 'lucide-react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextPlaceholder } from '@/components/ui/text-placeholder';
import { SheetScroll, leaveSheetTo } from '@/components/sheet';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';
import { CARD_SURFACE } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Glyph } from '@/components/ui/glyph';
import { useTransitTexts } from '@/lib/transit-texts';
import { useResolvedProfile } from '@/store/profile';
import { useEntitlement } from '@/store/auth';
import { findTransits } from '@/lib/transits';
import { vrstaSekcije, type VrstaSekcije } from '@/lib/tumacenje';
import { neutral } from '@/theme/tokens';

const GOLD = '#A7731B';

/**
 * Ikona uz naslov sekcije duge verzije — boja naslova (`label`), ne akcenat.
 * SF Symbols na iOS-u; Android i web crtaju isti znak iz Material Symbols
 * (expo-symbols nosi font sam, radi i u Expo Go).
 */
const IKONA_SEKCIJE: Record<VrstaSekcije, SymbolViewProps['name']> = {
  sustina: { ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' },
  dugorocno: { ios: 'hourglass', android: 'hourglass_empty', web: 'hourglass_empty' },
  sfere: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  efekat: { ios: 'checkmark.circle', android: 'check_circle', web: 'check_circle' },
  pazi: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  savet: { ios: 'lightbulb', android: 'lightbulb', web: 'lightbulb' },
};

/**
 * Detaljno tumacenje jednog tranzita — duga verzija.
 *
 * Duga verzija stize samo ako korisnik ima aktivan pristup. To NE proverava
 * ova komponenta nego RLS politika u bazi: server jednostavno ne posalje
 * tekst. Ako `long` stigne prazan a `short` nije, znaci da pristup nije
 * placen — i tada se prikazuje kratka verzija sa pozivom na otkljucavanje.
 */
export default function TransitDetail() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const resolved = useResolvedProfile();
  const entitlement = useEntitlement();

  const kljucevi = React.useMemo(() => (key ? [String(key)] : []), [key]);
  const { texts: duga, loading: dugaLoading } = useTransitTexts(kljucevi, 'long');
  const { texts: kratka } = useTransitTexts(kljucevi, 'short');

  const tranzit = React.useMemo(() => {
    if (!resolved || !key) return null;
    return findTransits(resolved.chart).find((t) => t.contentKey === key) ?? null;
  }, [resolved, key]);

  if (!resolved) return <Redirect href="/" />;

  const puna = duga.get(String(key));
  const sazeta = kratka.get(String(key));

  return (
    // Nativni list odozdo, kao sva tumacenja (`_layout.tsx`, Ivan 28.9.2026).
    <SheetScroll>
          {tranzit && (
            <View className="flex-row items-center gap-2 pb-1">
              <Glyph size={17} className="text-foreground">
                {`${tranzit.transiting.glyph} ${tranzit.aspect.glyph} ${tranzit.natal.glyph}`}
              </Glyph>
              <Text variant="label">
                {tranzit.transiting.name} {tranzit.aspect.name} natalni {tranzit.natal.name}
              </Text>
            </View>
          )}

          <Text variant="display" className="mb-5 mt-1">
            {puna?.title || sazeta?.title || 'Tranzit'}
          </Text>

          {dugaLoading ? (
            <TextPlaceholder lines={8} />
          ) : puna ? (
            <>
              {!!puna.body && <TumacenjeTekst tekst={puna.body} />}
              {puna.sections.map((s) => {
                const vrsta = vrstaSekcije(s.heading);

                return (
                <View key={s.heading} className="mt-7">
                  {/* Linija ispod naslova: list je beo, pa `border-border` (pravilo 17). */}
                  <View className="mb-3 flex-row items-center gap-2 border-b border-border pb-2">
                    {vrsta && <SymbolView name={IKONA_SEKCIJE[vrsta]} size={17} tintColor={neutral.inkSubtle} />}
                    <Text variant="label" className="flex-1">{s.heading}</Text>
                  </View>
                  <TumacenjeTekst tekst={s.body} />
                </View>
                );
              })}
            </>
          ) : (
            <>
              {!!sazeta?.body && <Text variant="reading">{sazeta.body}</Text>}

              {/* Pristup je placen a duga verzija ipak nije dosla — tekst za
                  ovaj tranzit jos nije u korpusu. Poziv na kupovinu bi tu bio
                  pogresan: nema sta da se otkljuca. */}
              {entitlement?.active ? (
                <Text variant="muted" className="mt-6 text-xs">
                  Tumačenje za ovaj tranzit još nije napisano.
                </Text>
              ) : (
                <View className={cn(CARD_SURFACE, 'mt-8 border-gold/40 p-6')}>
                  <View className="h-12 w-12 items-center justify-center self-center rounded-full bg-gold/10">
                    <Lock size={20} color={GOLD} />
                  </View>
                  <Text variant="h3" className="mt-4 text-center">Detaljno tumačenje</Text>
                  <Text variant="muted" className="mt-2 text-center">
                    Dugoročni efekti, sfere života na koje se odnosi, i konkretni
                    saveti za ovaj period.
                  </Text>
                  <Button className="mt-5 w-full" onPress={() => leaveSheetTo('/profile')}>
                    <Text>Otključaj</Text>
                  </Button>
                </View>
              )}
            </>
          )}
    </SheetScroll>
  );
}
