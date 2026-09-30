/**
 * Nova osoba dok se unosi korak po korak (`app/nova-osoba/`, 29.9.2026).
 *
 * Namerno bez `persist`, kao onboarding (pravilo 12): prekid znaci pocetak
 * ispocetka. Na server ide tek u poslednjem koraku, pa nedovrsene osobe nema.
 * Brise se pri svakom ulasku u tok (`TvojiLjudi`).
 */
import { create } from 'zustand';

import type { City } from '@/lib/cities';
import type { OdnosKljuc } from '@/lib/osobe';

export type NovaOsobaNacrt = {
  ime: string;
  odnos: OdnosKljuc | null;
  datum: { year: number; month: number; day: number } | null;
  /** null = vreme nije poznato ("Ne znam vreme") ili jos nije uneto. */
  vreme: { hour: number; minute: number } | null;
  /** Ceo grad — koordinate i zona putuju s njim (grad dijaspore nije u ugradjenoj listi). */
  grad: City | null;
};

const PRAZNO: NovaOsobaNacrt = { ime: '', odnos: null, datum: null, vreme: null, grad: null };

export const useNovaOsoba = create<NovaOsobaNacrt & {
  postavi: (d: Partial<NovaOsobaNacrt>) => void;
  reset: () => void;
}>((set) => ({
  ...PRAZNO,
  postavi: (d) => set(d),
  reset: () => set(PRAZNO),
}));
