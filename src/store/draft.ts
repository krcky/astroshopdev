/**
 * Podaci prikupljeni tokom onboardinga, PRE nego sto nalog postoji.
 *
 * Namerno bez `persist` — dogovoreno je da prekid znaci pocetak ispocetka.
 * Zato ovo nikad ne dodiruje disk: nema delimicnog stanja koje bi trebalo
 * cistiti, ni nedovrsenih profila koji bi zbunili gate.
 */
import { create } from 'zustand';

export type Draft = {
  date: { year: number; month: number; day: number } | null;
  time: { hour: number; minute: number } | null;
  /** true ako je korisnik svesno preskocio vreme (SKIP), a ne da jos nije stigao dotle. */
  timeSkipped: boolean;
  cityName: string | null;
  name: string;
};

const EMPTY: Draft = { date: null, time: null, timeSkipped: false, cityName: null, name: '' };

type DraftState = Draft & {
  set: (patch: Partial<Draft>) => void;
  reset: () => void;
  /** Ima li dovoljno da se izracuna karta. */
  isComplete: () => boolean;
};

export const useDraft = create<DraftState>((set, get) => ({
  ...EMPTY,
  set: (patch) => set(patch),
  reset: () => set(EMPTY),
  isComplete: () => {
    const s = get();
    return s.date !== null && s.cityName !== null && (s.time !== null || s.timeSkipped);
  },
}));
