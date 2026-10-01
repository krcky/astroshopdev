import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { Crown } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { neutral } from '@/theme/tokens';
import { AspektIkona, imaAspekt, type AspektKljuc } from '@/components/aspekt-ikona';
import { AspektIlustracija } from '@/components/aspekt-ilustracija';
import { Planeta } from '@/components/planete-par';
import { PlanetaSaZnakom, imaSlikuSaZnakom } from '@/components/planeta-sa-znakom';
import { PLANETA_POTEZ, IkonaTacke } from '@/components/planeta-ikona';
import { OBLAST_BOJA } from '@/components/oblast-ikona';
import { tvojDanInfo } from '@/lib/tvoj-dan';
import { trajanjeTranzita } from '@/lib/oblasti';
import { TransitTrajanje } from '@/components/transit-trajanje';
import { SheetGrabber, dnoLista } from '@/components/sheet';
import { useResolvedProfile } from '@/store/profile';
import { useT } from '@/i18n';

/** Precnik crnih ikonica — isti kao u zaglavlju tumacenja tranzita (`transit.tsx`). */
const SIMBOL = 26;
/** Visina slike planete vladara (sa znakom) u okviru "Tranzit tvog vladara". */
const VLADAR = 56;

/**
 * Nativni iOS list odozdo (`formSheet`, visok koliko sadrzaj — registrovan u
 * `_layout.tsx`): na osnovu cega je napisan tekst na kartici "Tvoj dan".
 * Koji je to tranzit (planeta, aspekt, natalna tacka) i, kad vazi, zasto ima
 * prednost — tranzit vladara horoskopa (Ivan, 28.9.2026).
 *
 * Parametar je samo kljuc tranzita; sve ostalo se cita iz karte korisnika.
 * Zatvara se povlacenjem nadole — iOS list ima rucicu, dugme nije potrebno.
 */
export default function TvojDanInfo() {
  const t = useT();
  const tx = t.danas.tvojDanInfo;
  const { key, day } = useLocalSearchParams<{ key: string; day?: string }>();
  const resolved = useResolvedProfile();
  const insets = useSafeAreaInsets();
  if (!resolved) return <Redirect href="/" />;
  const info = key ? tvojDanInfo(resolved.chart, resolved.timeUnknown, String(key)) : null;
  // Dan sa kartice ("2026-09-28"); bez njega danas. Podne, da je dan jednoznacan.
  const m = typeof day === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date();
  const prozor = info ? trajanjeTranzita(info, date) : null;

  return (
    // Dno kao bokovi, 24 (Ivan, 28.9.2026: "da bude isto kao levo i desno").
    // iOS: list visine po sadrzaju (`fitToContents`) SAM dodaje donji sigurni
    // prostor ispod sadrzaja (UIKit detent se meri bez njega) — snimak: 24 + ~32
    // = 56pt. Zato se ovde odbija: sadrzaj ulazi u taj prostor toliko da vidljivo
    // dno bude 24 (`dnoLista`). Android: modal do dna, pa umetak + 24.
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      {/* Ista velicina kao naslov lista "Šta je natalna karta" (Ivan, 28.9.2026). */}
      <Text variant="naslovLista">{tx.naslov}</Text>

      {info ? (
        <>
          {/* Razmaci veci nego ranije, da list "prodise" (Ivan, 28.9.2026: "sve je mnogo zbijeno"). */}
          <Text variant="body" className="mt-3">
            {tx.uvod}
          </Text>

          {/* Koji tranzit — u obliku zaglavlja tumacenja tranzita (Ivan, 28.9.2026:
              "iste ikonice, isti progress bar"): levo crne ikonice sa znakom aspekta
              izmedju, oznaka i ime; desno ilustracija aspekta, dnom u ravni sa imenom. */}
          <View className="mt-8 flex-row gap-4">
            <View
              className="flex-1 justify-between"
              accessible
              accessibilityLabel={t.danas.tranzit.imeNatalni(info.transiting.name, info.aspect.name, info.natal.name)}>
              <View className="flex-row items-center gap-2">
                <Tacka tacka={info.transiting} vladar={info.ruler === 'transiting'} />
                {imaAspekt(info.aspect.key) && (
                  <AspektIkona aspekt={info.aspect.key as AspektKljuc} size={15} potez={PLANETA_POTEZ * SIMBOL} />
                )}
                <Tacka tacka={info.natal} vladar={info.ruler === 'natal'} />
              </View>
              <View className="mt-5">
                <Text variant="oznaka">{tx.tranzitDana}</Text>
                <Text variant="h2" className="mt-1.5">
                  {t.danas.tranzit.imeNatalni(info.transiting.name, info.aspect.name, info.natal.name)}
                </Text>
              </View>
            </View>
            {imaAspekt(info.aspect.key) && (
              <View className="justify-end">
                <AspektIlustracija
                  aspekt={info.aspect.key}
                  tranzitna={{ key: info.transiting.key, glyph: info.transiting.glyph, vladar: info.ruler === 'transiting' }}
                  natalna={{ key: info.natal.key, glyph: info.natal.glyph, vladar: info.ruler === 'natal' }}
                  width={96}
                />
              </View>
            )}
          </View>

          {/* Trajanje tranzita — ista lila traka i isti opseg datuma ("13 SEP – 26 SEP")
              kao na tumacenju tranzita (Ivan, 28.9.2026; ranije "Od 13. septembra"). */}
          {prozor && (
            <TransitTrajanje trajanje={prozor} date={date} className="mt-7" boja={OBLAST_BOJA} opseg />
          )}

          <Text variant="muted" className="mt-4">
            {tx.objasnjenje(info.aspect.angle)}
          </Text>

          {info.rulerText && info.ruler && (
            // Naslov gore levo; ispod slika planete vladara SA ZNAKOM levo, tekst
            // desno (Ivan, 28.9.2026), slika poravnata uz VRH teksta. Planeta bez te slike: stara slika.
            <View className="mt-8 rounded-lg bg-fill p-5">
              <View className="flex-row items-center gap-1.5">
                <Crown size={15} color={neutral.ink} strokeWidth={2} />
                <Text variant="h3">{tx.tranzitVladara}</Text>
              </View>
              <View className="mt-4 flex-row items-start gap-4">
                {(() => {
                  const vladar = info.ruler === 'transiting' ? info.transiting : info.natal;
                  return imaSlikuSaZnakom(vladar.key)
                    ? <PlanetaSaZnakom planeta={vladar.key} visina={VLADAR} />
                    : <Planeta t={vladar} size={VLADAR} />;
                })()}
                <Text variant="body" className="flex-1">{info.rulerText}</Text>
              </View>
            </View>
          )}
        </>
      ) : (
        <Text variant="muted" className="mt-4">{tx.nijeDeoKarte}</Text>
      )}
    </View>
  );
}

/** Crna ikonica tacke, sa krunicom kad je vladar horoskopa (ista krunica kao na ilustraciji). */
function Tacka({ tacka, vladar }: { tacka: { key: string; glyph: string }; vladar: boolean }) {
  return (
    <View>
      <IkonaTacke tacka={tacka} size={SIMBOL} />
      {vladar && (
        <View
          className="absolute items-center justify-center rounded-full border border-border bg-background"
          style={{ width: SIMBOL * 0.5, height: SIMBOL * 0.5, right: -SIMBOL * 0.14, top: -SIMBOL * 0.14 }}>
          <Crown size={Math.round(SIMBOL * 0.3)} color={neutral.ink} strokeWidth={2.4} />
        </View>
      )}
    </View>
  );
}

