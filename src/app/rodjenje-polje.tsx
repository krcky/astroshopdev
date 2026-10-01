import * as React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WheelPicker } from '@/components/ui/wheel-picker';
import { SheetGrabber, SheetScroll, dnoLista } from '@/components/sheet';
import { BezInterneta } from '@/components/bez-interneta';
import { IzborOdnosa } from '@/components/izbor-odnosa';
import { PoljeMesto } from '@/components/polje-mesto';
import { izmeniOsobu, useOsoba, type NovaOsoba } from '@/lib/osobe-api';
import { porukaOsobe, type OdnosKljuc, type PoljeOsobe } from '@/lib/osobe';
import type { City } from '@/lib/cities';
import { useNaMrezi } from '@/lib/mreza';
import { useAuthStore } from '@/store/auth';
import { gradProfila, placeFields, useProfileStore, type Profile } from '@/store/profile';
import { pushProfile } from '@/lib/sync';

/**
 * Izmena JEDNOG podatka o rodjenju — list odozdo sa reda tabele (Ivan, 29.9.2026:
 * "da izadje samo ta jedna stvar koja se menja"). Sa `?osoba=` je podatak druge
 * osobe (`/osoba-uredi`), bez njega korisnikov (list "Nalog").
 *
 * Ime i mesto trebaju tastaturu i listu predloga, pa je list do vrha
 * (`_layout.tsx`); ostala polja su list visok koliko sadrzaj. "Ko ti je" se cuva
 * cim se izabere, ostalo na "Sačuvaj". Upis ide na server (bez mreze ne ide).
 */
export default function OsobaPolje() {
  const t = useT();
  const td = t.profil.rodjenje;
  const tl = t.profil.rodjenjePolje;
  const { osoba: id, polje } = useLocalSearchParams<{ osoba?: string; polje: PoljeOsobe }>();
  const drugaOsoba = useOsoba(id);
  const svoj = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  // Ista polja: osoba je profil sa odnosom (`lib/osobe.ts`).
  const osoba: (Profile & { odnos?: OdnosKljuc | null }) | null = id ? drugaOsoba : svoj;
  const uid = useAuthStore((s) => s.user?.id);
  const naMrezi = useNaMrezi();
  const insets = useSafeAreaInsets();

  const [ime, setIme] = React.useState(osoba?.name ?? '');
  const [datum, setDatum] = React.useState(() =>
    osoba ? new Date(osoba.birth.year, osoba.birth.month - 1, osoba.birth.day, 12) : new Date(2000, 0, 1, 12)
  );
  const [vremePoznato, setVremePoznato] = React.useState(!!osoba?.time);
  const [vreme, setVreme] = React.useState(() => {
    const d = new Date(2000, 0, 1, 12, 0);
    if (osoba?.time) { d.setHours(osoba.time.hour); d.setMinutes(osoba.time.minute); }
    return d;
  });
  const [grad, setGrad] = React.useState<City | null>(() => (osoba ? gradProfila(osoba) : null));
  const [radi, setRadi] = React.useState(false);
  const [poruka, setPoruka] = React.useState<string | null>(null);

  if (!osoba || !uid) {
    return <SheetScroll><Text variant="muted">{td.nemaVise}</Text></SheetScroll>;
  }

  const sacuvaj = async (izmena: Partial<NovaOsoba>) => {
    if (radi) return;
    setRadi(true);
    setPoruka(null);
    try {
      if (id && drugaOsoba) {
        await izmeniOsobu(uid, id, { ...drugaOsoba, ...izmena });
      } else {
        // Svoj profil: prvo server, pa telefon — neuspeh ne ostavlja telefon i server
        // u razlicitom stanju (server pobedjuje pri sledecoj sinhronizaciji, `sync.ts`).
        const { odnos: _o, ...promena } = izmena;
        const novi = { ...osoba, ...promena } as Profile;
        const greska = await pushProfile(uid, novi);
        if (greska) throw new Error(greska.message);
        setProfile(novi);
      }
      router.back();
    } catch (e) {
      setPoruka(porukaOsobe((e as Error)?.message));
      setRadi(false);
    }
  };

  const dno = (dugme: { label: string; onPress: () => void; disabled?: boolean } | null) => (
    <>
      {!!poruka && <Text variant="note" className="mt-5 text-foreground">{poruka}</Text>}
      {!naMrezi && !poruka && <Text variant="note" className="mt-5">{tl.trebaInternet}</Text>}
      {dugme && (
        <Button className="mt-5" disabled={dugme.disabled || !naMrezi} ucitava={radi} onPress={dugme.onPress}>
          <Text>{dugme.label}</Text>
        </Button>
      )}
    </>
  );

  // Do vrha: ime i mesto (tastatura, predlozi).
  if (polje === 'ime' || polje === 'mesto') {
    return (
      <SheetScroll keyboardShouldPersistTaps="handled">
        <Text variant="naslovLista">{polje === 'ime' ? td.ime : td.mesto}</Text>
        <View className="mt-6">
          {polje === 'ime' ? (
            <Input
              value={ime}
              onChangeText={setIme}
              placeholder={id ? td.imeIliNadimak : tl.tvojeIme}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              maxLength={60}
              returnKeyType="done"
              onSubmitEditing={() => { if (ime.trim()) sacuvaj({ name: ime.trim() }); }}
            />
          ) : (
            <PoljeMesto grad={grad} onGrad={setGrad} autoFocus />
          )}
        </View>
        {polje === 'ime'
          ? dno({ label: t.opste.sacuvaj, onPress: () => sacuvaj({ name: ime.trim() }), disabled: !ime.trim() || ime.trim() === osoba.name })
          // Mesto: dugme tek kad je grad izabran (dok se kuca, predlozi trebaju prostor).
          : dno(grad ? { label: t.opste.sacuvaj, onPress: () => sacuvaj(placeFields(grad)) } : null)}
      </SheetScroll>
    );
  }

  // Visok koliko sadrzaj: ko ti je, datum, vreme.
  return (
    <View className="bg-background px-6 pt-8" style={dnoLista(insets.bottom)}>
      <SheetGrabber />
      <BezInterneta className="mb-4" />
      {polje === 'odnos' ? (
        <>
          <Text variant="naslovLista">{td.koTiJe(osoba.name)}</Text>
          <View className="mt-4">
            <IzborOdnosa naBelom izabran={osoba.odnos ?? null}
              onIzbor={(k: OdnosKljuc) => (k === osoba.odnos ? router.back() : sacuvaj({ odnos: k }))} />
          </View>
          {dno(null)}
        </>
      ) : polje === 'datum' ? (
        <>
          <Text variant="naslovLista">{td.datum}</Text>
          <View className="mt-4">
            <WheelPicker mode="date" value={datum} onChange={setDatum} maximumDate={new Date()} />
          </View>
          {dno({
            label: t.opste.sacuvaj,
            onPress: () => sacuvaj({ birth: { year: datum.getFullYear(), month: datum.getMonth() + 1, day: datum.getDate() } }),
          })}
        </>
      ) : (
        <>
          <Text variant="naslovLista">{td.vreme}</Text>
          {vremePoznato ? (
            <View className="mt-4">
              <WheelPicker mode="time" value={vreme} onChange={setVreme} />
            </View>
          ) : (
            <Text variant="body" className="mt-3">
              {tl.vremeNijeUneto}
            </Text>
          )}
          <Pressable
            onPress={() => setVremePoznato(!vremePoznato)}
            accessibilityRole="button"
            className="mt-3 items-center py-2 active:opacity-60">
            <Text variant="label" className="text-foreground underline">
              {vremePoznato ? td.neZnamVreme : tl.znamVreme}
            </Text>
          </Pressable>
          {dno({
            label: t.opste.sacuvaj,
            onPress: () => sacuvaj({ time: vremePoznato ? { hour: vreme.getHours(), minute: vreme.getMinutes() } : null }),
          })}
        </>
      )}
    </View>
  );
}
