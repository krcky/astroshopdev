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
import { useTransitTexts } from '@/lib/transit-texts';
import { useResolvedProfile } from '@/store/profile';
import { useEntitlement } from '@/store/auth';
import { tvojDanInfo } from '@/lib/tvoj-dan';
import { trajanjeTranzita } from '@/lib/oblasti';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { PLANETA_POTEZ, TamnaTacka } from '@/components/planeta-ikona';
import { TransitTrajanje } from '@/components/transit-trajanje';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
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

  // Sve o tranzitu iz KLJUCA i karte (ne iz trenutnog neba): planete, aspekt,
  // vladar; trajanje isto kao na listi (`trajanjeTranzita`).
  const danas = React.useMemo(() => new Date(), []);
  const tranzit = React.useMemo(
    () => (resolved && key ? tvojDanInfo(resolved.chart, resolved.timeUnknown, String(key)) : null),
    [resolved, key]
  );
  const prozor = React.useMemo(() => (tranzit ? trajanjeTranzita(tranzit, danas) : null), [tranzit, danas]);

  if (!resolved) return <Redirect href="/" />;

  const puna = duga.get(String(key));
  const sazeta = kratka.get(String(key));

  return (
    // Nativni list odozdo, kao sva tumacenja (`_layout.tsx`, Ivan 28.9.2026).
    <SheetScroll>
          {/* Gore: ikonice levo, ime tranzita GORE DESNO (Ivan, 28.9.2026). Ispod:
              naslov levo i ilustracija aspekta desno, dnom u istoj ravni. */}
          {tranzit && (
            <View className="flex-row items-center gap-3">
              <View className="flex-row items-center gap-2">
                <Simbol tacka={tranzit.transiting} />
                <AspektIkona aspekt={tranzit.aspect.key as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
                <Simbol tacka={tranzit.natal} />
              </View>
              <Text variant="oznaka" className="flex-1 text-right">
                {tranzit.transiting.name} {tranzit.aspect.name} {tranzit.natal.name}
              </Text>
            </View>
          )}
          <View className="mt-7 flex-row items-end gap-5">
            {/* Cele reci: duga rec u uskoj koloni smanji naslov umesto da se prelomi (32 -> najmanje 22). */}
            <NaslovCeleReci size={32} lineHeight={38} min={22} className="flex-1">
              {puna?.title || sazeta?.title || 'Tranzit'}
            </NaslovCeleReci>
            {tranzit && imaAspekt(tranzit.aspect.key) && (
              <AspektIlustracija
                aspekt={tranzit.aspect.key}
                tranzitna={{ key: tranzit.transiting.key, glyph: tranzit.transiting.glyph, vladar: tranzit.ruler === 'transiting' }}
                natalna={{ key: tranzit.natal.key, glyph: tranzit.natal.glyph, vladar: tranzit.ruler === 'natal' }}
                width={120}
              />
            )}
          </View>
          {/* Traka u svetloj lila, boji ikonica oblasti i izabranog taba (Ivan, 28.9.2026). */}
          {prozor && tranzit && (
            <TransitTrajanje trajanje={prozor} date={danas} className="mt-8" boja={OBLAST_BOJA} opseg />
          )}
          <View className="mb-8" />

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

/** Precnik crnih ikonica planeta u zaglavlju lista (Ivan: "smanji"). */
const SIMBOL = 26;

/** Crna ikonica planete (ili Asc/MC) za zaglavlje lista — ista i na natalnom tumacenju. */
function Simbol({ tacka }: { tacka: { key: string; glyph: string } }) {
  return <TamnaTacka tacka={tacka} size={SIMBOL} />;
}
