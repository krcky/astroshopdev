import * as React from 'react';
import { SafeAreaInsetsContext, useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

/**
 * Umeci prozora (statusna traka, home indikator) uhvaceni u korenu aplikacije,
 * ispod korenskog `SafeAreaProvider`-a — vidi `UmeciTaba`.
 */
const KorenskiUmeciContext = React.createContext<EdgeInsets | null>(null);

export function KorenskiUmeci({ children }: { children: React.ReactNode }) {
  const umeci = useSafeAreaInsets();
  return <KorenskiUmeciContext.Provider value={umeci}>{children}</KorenskiUmeciContext.Provider>;
}

/**
 * Popravlja umetke taba koji jos nije bio na ekranu.
 *
 * expo-router svaki native tab obmota SVOJIM `SafeAreaProvider`-om
 * (`NativeTabsView.ios.js`), a native tabovi montiraju sve ekrane odmah. Pogled
 * skrivenog taba nije u prozoru, pa njegov provider javi umetak vrha 0
 * (`RNCSafeAreaProviderComponentView` salje cim pogled ima roditelja, ne tek kad
 * je u prozoru). Tab se zato unapred iscrta sa naslovom preko sata i sadrzajem
 * previsoko; pri PRVOM prikazu stigne pravi umetak i sve skoci dole — ~0,1 s
 * bljeska na svakom tabu (snimak sa iPhone-a, Release build, Ivan 29.9.2026).
 * Posle prvog prikaza pogled zadrzi poslednje umetke, pa se ne ponavlja.
 *
 * Ekran u tabu uvek ide ispod statusne trake, pa vrh 0 tu znaci samo "jos nije
 * u prozoru": tada vazi umetak prozora iz korena. Cim tab stvarno ima svoje
 * umetke, oni pobedjuju.
 */
export function UmeciTaba({ children }: { children: React.ReactNode }) {
  const lokalni = useSafeAreaInsets();
  const koren = React.useContext(KorenskiUmeciContext);
  const umeci = React.useMemo(
    () =>
      koren && lokalni.top === 0 && koren.top > 0
        ? { ...lokalni, top: koren.top, bottom: lokalni.bottom || koren.bottom }
        : lokalni,
    [koren, lokalni]
  );
  return <SafeAreaInsetsContext.Provider value={umeci}>{children}</SafeAreaInsetsContext.Provider>;
}
