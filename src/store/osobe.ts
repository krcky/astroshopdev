/**
 * Druge osobe na ovom telefonu — kes servera (`supabase/osobe.sql`), kao profil.
 *
 * Na disku je da karta osobe radi i bez interneta (pravilo 19); izvor istine je
 * server, pa se spisak zamenjuje celim kad stigne (`lib/osobe-api.ts`). Spisak
 * PRIPADA NALOGU: nosi `uid`, tudji se cita kao prazan, pri odjavi se brise (kao
 * dnevnici, pravilo 18).
 *
 * Namerno bez uvoza `store/auth` — auth brise ovaj store pri odjavi, pa bi uvoz
 * u oba smera bio krug. Hook-ovi koji traze nalog su u `lib/osobe-api.ts`.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { poRedu, type Osoba } from '@/lib/osobe';

type OsobeState = {
  /** Ciji je spisak; null = jos nije stigao ni za jedan nalog. */
  uid: string | null;
  /** Redom dodavanja (`poRedu`). */
  osobe: Osoba[];
  postavi: (uid: string, osobe: Osoba[]) => void;
  /** Jedna osoba posle upisa na server: nova se dodaje, postojeca menja. */
  upisi: (uid: string, osoba: Osoba) => void;
  ukloni: (uid: string, id: string) => void;
  clear: () => void;
};

export const useOsobeStore = create<OsobeState>()(
  persist(
    (set, get) => ({
      uid: null,
      osobe: [],
      postavi: (uid, osobe) => set({ uid, osobe: poRedu(osobe) }),
      upisi: (uid, osoba) => {
        const s = get();
        const ranije = s.uid === uid ? s.osobe.filter((o) => o.id !== osoba.id) : [];
        set({ uid, osobe: poRedu([...ranije, osoba]) });
      },
      ukloni: (uid, id) => {
        const s = get();
        if (s.uid === uid) set({ osobe: s.osobe.filter((o) => o.id !== id) });
      },
      clear: () => set({ uid: null, osobe: [] }),
    }),
    {
      name: 'astroshop-osobe',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ uid: s.uid, osobe: s.osobe }) as unknown as OsobeState,
    }
  )
);
