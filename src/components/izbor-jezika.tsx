import { IzborJezikaRezerva } from '@/components/izbor-jezika-rezerva';

export { natpis, SpisakJezika } from '@/components/izbor-jezika-rezerva';

/**
 * Izbor jezika na prvom ekranu (Ivan, 2.10.2026): ispod "Već imam nalog", centrirano — zastava i
 * ime jezika, na dodir spisak sa kvacicom. Bez izbora je srpski (`store/jezik.ts`); promena jezika
 * sklapa navigaciju iznova (`key` na `Stack` u `_layout.tsx`), pa se ekran vrati vec preveden.
 * iOS 26: sistemski meni u staklenom dugmetu (`izbor-jezika.ios.tsx`); ovde rezerva.
 */
export function IzborJezika() {
  return <IzborJezikaRezerva />;
}
