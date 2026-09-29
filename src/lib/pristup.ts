/**
 * Sta besplatni korisnik vidi — JEDNO mesto za sve granice (Ivan, 29.9.2026).
 *
 * Besplatni i Premium vide ISTE ekrane; Premium otkljucava dubinu. Ekrani ne
 * pisu svoje brojeve nego citaju odavde, da se granica menja na jednom mestu.
 *
 * Ovo je samo PRIKAZ. Sve sto se ovde krije racuna se na telefonu (ocene,
 * izbor i redosled tranzita) i nije korpus. Tekstovi koji se placaju (duga
 * tumacenja, natalna van velike trojke) i dalje stizu samo sa servera, po RLS-u
 * (pravilo 8) — ne sakrivaju se ovde.
 */
import type { OblastKey } from '@/lib/oblasti-config';

export const BESPLATNO = {
  /** Tab "Tranziti": prvih N kartica; ostali su zakljucani redovi sa imenom. */
  tranzitiDana: 3,
  /** Slajd "Tema perioda" na pocetnoj: prvih N sporih tranzita. */
  temaPerioda: 1,
  /** Ocene oblasti na "Danas ukratko": ocena se vidi samo za ove, ostale su pod katancem. */
  oblasti: ['ljubav'] as readonly OblastKey[],
  /**
   * Dan-meni (juce, sutra, ±2 dana) — besplatni otvara samo danas. Kalendar ipak
   * vidi: ostali dani stoje u meniju sa katancem i vode na paywall (Ivan, 29.9.2026).
   */
  danMeni: false,
} as const;
