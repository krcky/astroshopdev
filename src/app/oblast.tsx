import * as React from 'react';
import { View } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';

import { Text } from '@/components/ui/text';
import { CARD_SURFACE } from '@/components/ui/card';
import { SheetScroll } from '@/components/sheet';
import { OcenaTackice } from '@/components/ocena-oblasti';
import { KarticaTranzita } from '@/components/tranziti-lista';
import { PremiumKartica, ZakljucaniRedovi } from '@/components/zakljucano';
import { recenicaOblasti, recenicaNedelje, neutralnaRecenica } from '@/lib/krug-tekst';
import { BESPLATNO } from '@/lib/pristup';
import { KRUG, type KrugKey } from '@/lib/krug-config';
import { ocenePoDanima, danPomeren } from '@/lib/krug';
import { tekstReda, trajanjeTekst, trajanjeTranzita, type TranzitRed } from '@/lib/oblasti';
import { useTransitTexts } from '@/lib/transit-texts';
import { useKrug } from '@/lib/use-krug';
import { useProfileStore, useResolvedProfile } from '@/store/profile';
import { usePremium } from '@/store/auth';
import { useT } from '@/i18n';
import { brand } from '@/theme/tokens';
import { IKONA_OBLASTI } from '@/components/krug-zivota';
import { OBLAST_BOJA, OblastIkona } from '@/components/oblast-ikona';
import { NaslovSekcije } from '@/components/naslov-sekcije';
import { NaslovCeleReci } from '@/components/naslov-cele-reci';
import { TumacenjeTekst } from '@/components/tumacenje-tekst';

/** Najvise tranzita u listi — ostali su samo broj ("još 4 tranzita u ovoj oblasti"). */
const NAJVISE = 4;

/**
 * List jedne oblasti kruga zivota (Ivan, 8.10.2026) — "Saznaj više" sa kartice ispod kruga.
 * Stanje i tackice, recenica za danas, "Šta utiče" (tranziti u oblasti, najjaci prvi, svaki vodi na ceo
 * tekst `/transit`), a za Premium i narednih 7 dana. Besplatni: potpuno otvorene su samo oblasti iz
 * `BESPLATNO.krug`, u njima je otvoren najjaci tranzit, ostali po imenu pod katancem.
 */
export default function OblastList() {
  const t = useT();
  const { k, day } = useLocalSearchParams<{ k: string; day?: string }>();
  const resolved = useResolvedProfile();
  const hydrated = useProfileStore((s) => s.hydrated);
  const premium = usePremium();
  // Dan sa pocetne ("2026-10-08"); bez njega danas. Podne, da je dan jednoznacan.
  const m = typeof day === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  const date = React.useMemo(() => (m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12) : new Date()), [day]); // eslint-disable-line react-hooks/exhaustive-deps
  const { rez, tonovi } = useKrug(resolved, date);
  const oblast = rez?.oblasti.find((o) => o.def.key === k);

  const tranziti = React.useMemo(
    () => (oblast?.stavke.filter((s) => s.red.kind === 'tranzit') ?? []) as { red: TranzitRed; ton: import('@/lib/tone').Tone }[],
    [oblast]
  );
  const kljucevi = React.useMemo(() => tranziti.map((s) => s.red.key), [tranziti]);
  const { texts: kratke, loading: l1 } = useTransitTexts(kljucevi, 'short');
  const { texts: duge, loading: l2 } = useTransitTexts(kljucevi, 'long');

  const sedam = React.useMemo(
    () => (premium && resolved && oblast ? ocenePoDanima(oblast.def, resolved.chart, date, resolved.timeUnknown, tonovi) : null),
    [premium, resolved, oblast, date, tonovi]
  );

  if (!hydrated) return <SheetScroll siva><View /></SheetScroll>;
  if (!resolved || !KRUG.some((d) => d.key === k)) return <Redirect href="/" />;
  if (!oblast) return <SheetScroll siva><View /></SheetScroll>;

  const kljuc = oblast.def.key as KrugKey;
  const otvorena = premium || BESPLATNO.krug.includes(kljuc);
  const recenica = recenicaOblasti(oblast, kratke);
  const nedelja = recenicaNedelje(oblast, kratke);
  const naslov = (key: string) => duge.get(key)?.title || kratke.get(key)?.title || '';
  const prikazani = tranziti.slice(0, NAJVISE);
  // Besplatni: otvoren je najjaci, ostali su po imenu pod katancem.
  const otvoreni = premium ? prikazani : prikazani.slice(0, 1);
  const zakljucani = premium ? [] : prikazani.slice(1);
  const ostalo = tranziti.length - prikazani.length;
  const dani = t.datum.daniKratko;

  return (
    <SheetScroll siva>
      {/* Ikonica oblasti gore levo, stanje i tackice gore DESNO (bez obojenog kruga), naslov ispod (Ivan, 8.10.2026). */}
      <View className="flex-row items-start justify-between gap-3">
        <OblastIkona oblast={IKONA_OBLASTI[kljuc]} size={56} />
        <View className="mt-2 flex-row items-center gap-2 rounded-pill bg-white px-3 py-1.5">
          <Text variant="chip" style={{ color: brand.indigo }}>{t.krug.stanja[oblast.stanje]}</Text>
          <OcenaTackice ocena={oblast.ocena} />
        </View>
      </View>
      <NaslovCeleReci size={32} lineHeight={38} min={22} className="mt-3">{t.krug.oblasti[kljuc]}</NaslovCeleReci>

      {!otvorena ? (
        <PremiumKartica className="mt-10" naslov={t.krug.oblasti[kljuc]} opis={t.krug.zakljucanList} izLista />
      ) : (
        <>
          {/* Danas i Ove nedelje BEZ kartice (Ivan, 8.10.2026), naslovi kao podnaslovi u listu tumacenja tranzita; tekst isti
              kao ostatak teksta u tumacenju (`TumacenjeTekst`), ne kao velika prva recenica. */}
          <View className="mt-8">
            <NaslovSekcije>{t.krug.danas}</NaslovSekcije>
            <TumacenjeTekst tekst={recenica ?? neutralnaRecenica(kljuc) ?? t.krug.nemaUticaja} />
          </View>
          {nedelja && (
            <View className="mt-7">
              <NaslovSekcije>{t.krug.nedelja}</NaslovSekcije>
              <TumacenjeTekst tekst={nedelja} />
            </View>
          )}

          {sedam ? (
            <View className="mt-7">
              <NaslovSekcije>{t.krug.sedamDana}</NaslovSekcije>
              <View className={`${CARD_SURFACE} p-4`}>
                <View className="flex-row items-end justify-between" style={{ height: 78 }}>
                  {sedam.map((v, i) => (
                    <View key={i} className="items-center" style={{ flex: 1 }}>
                      <Text variant="caption" className="text-foreground">{v}</Text>
                      <View className="mt-1 rounded-[4px]" style={{ width: '70%', height: v * 10, backgroundColor: i === 0 ? brand.indigo : OBLAST_BOJA, opacity: i === 0 ? 1 : 0.5 }} />
                    </View>
                  ))}
                </View>
                <View className="mt-1 flex-row justify-between">
                  {sedam.map((_, i) => (
                    <Text key={i} variant="caption" className="flex-1 text-center">{t.gramatika.veliko(dani[danPomeren(date, i).getDay()])}</Text>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <PremiumKartica className="mt-7" naslov={t.krug.sedamDana} opis={t.krug.zakljucanoUPremium} izLista />
          )}

          {tranziti.length > 0 && (
            <View className="mt-7 gap-3">
              <NaslovSekcije>{t.krug.stavkeNaslov}</NaslovSekcije>
              {otvoreni.map((x) => (
                <KarticaTranzita key={x.red.key} red={x.red} ton={x.ton} naslov={naslov(x.red.key)} loading={l1 || l2}
                  trajanje={trajanjeTekst(trajanjeTranzita(x.red, date))} />
              ))}
              {zakljucani.length > 0 && (
                <ZakljucaniRedovi
                  redovi={zakljucani.map((z) => ({ key: z.red.key, naslov: tekstReda(z.red, '').veci, ispod: trajanjeTekst(trajanjeTranzita(z.red, date)) }))}
                />
              )}
              {ostalo > 0 && <Text variant="caption">{t.krug.josTranzita(ostalo, t.gramatika.tranzita(ostalo))}</Text>}
            </View>
          )}

        </>
      )}
    </SheetScroll>
  );
}
