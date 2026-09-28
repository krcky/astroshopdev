/** Opcije za `NativeDayMenu` (iOS varijanta je u `native-day-menu.ios.tsx`). */
export type NativeDayMenuProps = {
  /** Okidac je SF simbol (`calendar`), bez natpisa. */
  systemImage: string;
  /** Za VoiceOver: "Izabran dan: Danas…". */
  accessibilityLabel: string;
  color: string;
  options: { value: number; title: string }[];
  selected: number;
  onChange: (value: number) => void;
};

/** Van iOS-a native menija nema — pozivalac tamo crta svoj (`DayMenu`). */
export function NativeDayMenu(_props: NativeDayMenuProps): null {
  return null;
}
