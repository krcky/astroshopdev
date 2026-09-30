import * as React from 'react';
import { useDerivedValue, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

/**
 * SAT SLIKE PRICE (Ivan, 30.9.2026 — zbog videa): JEDNO vreme za sve pokrete na slici,
 * u ms od pocetka slike. Crtezi, reci koje ulaze, okretanje tocka i mrlje u pozadini
 * racunaju svoje stanje iz njega, umesto da svaki tece sam.
 *
 *  - U prici tece dok prica tece (`SatKojiTece`): drzanje prstom zaustavi i crteze, ne
 *    samo traku napretka.
 *  - U videu ga radionica postavlja kadar po kadar (`video-radionica.tsx`): kadar je
 *    tacno taj trenutak, koliko god snimanje trajalo.
 *  - BEZ SATA (kartica za sliku, "Smanji pokrete") sve stoji u konacnom stanju i nista
 *    se ne okrece.
 *
 * Zato ovde nema Reanimated `entering` ni `withTiming`: ta vremena teku po satu
 * telefona i ne mogu da se zaustave ni postave na kadar.
 */
export type Sat = SharedValue<number>;

/** Da li pokret tece (1) ili stoji (0) — SharedValue ili DerivedValue, dovoljno je `get()`. */
export type Tece = { get(): number };

/** Ublazavanje (worklet), npr. `Easing.out(Easing.cubic)` ili `Easing.bezierFn(...)`. */
export type Ublazavanje = (x: number) => number;

const SatKontekst = React.createContext<Sat | null>(null);

/**
 * VREME VIDEA (ms od prvog kadra), za pokret koji ide KROZ sve slike — krug loga
 * (`logo-price.tsx`). Sat slike ovde ne valja: krece od 0 na svakoj slici. Postavlja ga
 * radionica videa; u prici i na slici za deljenje ga nema.
 */
const VremeKontekst = React.createContext<Sat | null>(null);

export function VremeVidea({ vreme, children }: { vreme: Sat | null; children: React.ReactNode }) {
  return <VremeKontekst.Provider value={vreme}>{children}</VremeKontekst.Provider>;
}

export function useVremeVidea(): Sat | null {
  return React.useContext(VremeKontekst);
}

export function SatSlike({ sat, children }: { sat: Sat | null; children: React.ReactNode }) {
  return <SatKontekst.Provider value={sat}>{children}</SatKontekst.Provider>;
}

export function useSat(): Sat | null {
  return React.useContext(SatKontekst);
}

/** Sat slike u prici: tece od montiranja, dok je `tece` 1. Bez `pokret` (Smanji pokrete) sata nema. */
export function SatKojiTece({ tece, pokret, children }: { tece: Tece; pokret: boolean; children: React.ReactNode }) {
  const sat = useSharedValue(0);
  useFrameCallback((f) => {
    if (tece.get() === 0) return;
    sat.set(sat.get() + (f.timeSincePreviousFrame ?? 0));
  }, pokret);
  return <SatSlike sat={pokret ? sat : null}>{children}</SatSlike>;
}

/** 0 -> 1 izmedju `kasni` i `kasni + trajanje` ms po satu slike. Bez sata odmah 1. */
export function useNapredak(kasni: number, trajanje: number, ublazavanje: Ublazavanje) {
  const sat = useSat();
  return useDerivedValue(() => {
    if (!sat) return 1;
    const x = (sat.get() - kasni) / trajanje;
    return ublazavanje(x <= 0 ? 0 : x >= 1 ? 1 : x);
  }, [sat, kasni, trajanje, ublazavanje]);
}

/** Spor okret (tocak, zraci, Mesec) u stepenima: jedan krug za `period` sekundi. Bez sata 0. */
export function useOkret(period: number) {
  const sat = useSat();
  return useDerivedValue(() => (sat ? ((sat.get() / 1000 / period) * 360) % 360 : 0), [sat, period]);
}

/** Sekunde po satu slike (mrlje u pozadini). Bez sata 0 — mrlje na pocetnom mestu. */
export function useSekunde() {
  const sat = useSat();
  return useDerivedValue(() => (sat ? sat.get() / 1000 : 0), [sat]);
}
