/** Opcije za `NativeDayMenu` (iOS varijanta je u `native-day-menu.ios.tsx`). */
export type NativeDayMenuProps = {
  /** Okidac je SF simbol (`calendar`), bez natpisa. */
  systemImage: string;
  /**
   * Stranica kvadrata koji hvata dodir, pt — ceo krug oko ikone, ne samo sama
   * ikona od 19pt (bez ovoga se u krugu od 40pt lako promasi).
   */
  povrsina?: number;
  /** Za VoiceOver: "Izabran dan: Danas…". */
  accessibilityLabel: string;
  color: string;
  /**
   * `zakljucano`: dan koji besplatni ne moze da otvori — stoji u meniju sa
   * katancem, a dodir zove `onZakljucano` (paywall), ne `onChange`.
   */
  options: { value: number; title: string; zakljucano?: boolean }[];
  selected: number;
  onChange: (value: number) => void;
  onZakljucano?: (value: number) => void;
};

/** Van iOS-a native menija nema — pozivalac tamo crta svoj (`DayMenu`). */
export function NativeDayMenu(_props: NativeDayMenuProps): null {
  return null;
}
