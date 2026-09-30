/**
 * VIDEO PRICE (Ivan, 30.9.2026): posao pravljenja videa i gotov video za danas.
 *
 *  - `pravi`: radionica u korenu (`components/prica/video-radionica.tsx`) crta kadar po
 *    kadar, dok korisnik radi sta hoce. Ne ide na disk: posle ponovnog pokretanja
 *    aplikacije prekinut posao ne postoji.
 *  - `gotov`: MP4 na telefonu, SAMO za taj dan (sutra je druga prica). Stanje ide na disk,
 *    da traka i obavestenje vode na video i posle ponovnog pokretanja. Cim dan prodje
 *    (pokretanje ili ponoc dok je app otvorena) fajl se BRISE — 10—20 MB koji se nigde ne vide.
 *    Trajna kopija je "Sačuvaj u Fotografije" (`app/video-price.tsx`).
 *  - `sklonjen`: traka iznad tabova vise ne stoji (video je podeljen ili sklonjen). Video i
 *    dalje postoji do kraja dana — u prici, na "Podeli".
 *
 * PRIPADA NALOGU, kao `prica-log.ts`: nosi `uid`, tudji se cita kao prazan, pri odjavi
 * se brise zajedno sa fajlom (`store/auth.ts`).
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { dayKey } from '@/lib/transits';
import type { PricaDana } from '@/lib/use-prica';
import { useDanasStore } from '@/store/danas';

export type StanjeVidea = 'pravi' | 'gotov' | 'greska';

type State = {
  uid: string | null;
  dan: string | null;
  stanje: StanjeVidea | null;
  /** 0—1, dok se pravi. */
  napredak: number;
  uri: string | null;
  sklonjen: boolean;
  /** Prica zamrznuta u trenutku kad je korisnik trazio video — samo dok se pravi. */
  prica: PricaDana | null;
  pokreni: (uid: string, prica: PricaDana) => void;
  javiNapredak: (x: number) => void;
  gotovo: (uri: string) => void;
  neuspeh: () => void;
  skloni: () => void;
  clear: () => void;
};

const PRAZNO = { uid: null, dan: null, stanje: null, napredak: 0, uri: null, sklonjen: false, prica: null } as const;

/** Folder videa. Uvek najvise jedan fajl — nov posao brise stari. */
export function folderVidea(): Directory {
  return new Directory(Paths.document, 'video-price');
}

/** Citljivo ime: vidi se u meniju za deljenje, u Fajlovima i preko AirDrop-a (kao slika). */
export function fajlVidea(dan: string): File {
  return new File(folderVidea(), `Astro Shop ${dan}.mp4`);
}

function obrisiFolder() {
  try {
    const d = folderVidea();
    if (d.exists) d.delete();
  } catch { /* nista */ }
}

export const useVideoPrice = create<State>()(
  persist(
    (set, get) => ({
      ...PRAZNO,
      pokreni: (uid, prica) => {
        obrisiFolder();
        set({ uid, dan: prica.dan, stanje: 'pravi', napredak: 0, uri: null, sklonjen: false, prica });
      },
      javiNapredak: (napredak) => { if (get().stanje === 'pravi') set({ napredak }); },
      gotovo: (uri) => set({ stanje: 'gotov', napredak: 1, uri, prica: null }),
      neuspeh: () => set({ stanje: 'greska', prica: null }),
      skloni: () => set({ sklonjen: true }),
      clear: () => {
        obrisiFolder();
        set({ ...PRAZNO });
      },
    }),
    {
      name: 'astroshop-video-price',
      storage: createJSONStorage(() => AsyncStorage),
      // Na disk samo gotov video; posao koji je trajao ne moze da se nastavi. BEZ putanje:
      // iOS pri azuriranju aplikacije promeni putanju kontejnera, pa se ona racuna iz dana.
      partialize: (s) => (s.stanje === 'gotov'
        ? { uid: s.uid, dan: s.dan, stanje: s.stanje, sklonjen: s.sklonjen }
        : {}) as any,
      onRehydrateStorage: () => (s) => {
        if (s?.stanje !== 'gotov') {
          // Posao prekinut gasenjem aplikacije ostavi pola fajla — bez stanja nema ni njega.
          if (s && !s.stanje) obrisiFolder();
          return;
        }
        // Jucerasnji video se brise; fajl je mogao i sam nestati (sistem cisti) — bez njega nema videa.
        const f = s.dan ? fajlVidea(s.dan) : null;
        if (s.dan === dayKey(new Date()) && f?.exists) useVideoPrice.setState({ uri: f.uri });
        else s.clear();
      },
    }
  )
);

// Ponoc dok je aplikacija otvorena (`store/danas.ts`): gotov video od juce se brise. Posao koji
// upravo traje se ne dira — zavrsice se i pripasti danu za koji je poceo.
useDanasStore.subscribe(({ danas }) => {
  const v = useVideoPrice.getState();
  if (v.stanje && v.stanje !== 'pravi' && v.dan !== dayKey(danas)) v.clear();
});

/**
 * Video za ovaj nalog i ovaj dan. Jucerasnji gotov video se ne vidi (i obrise se sa
 * sledecim poslom); greska vazi samo dok je aplikacija otvorena.
 */
export function useVideoDana(uid: string | null, dan: string | null) {
  // `useShallow`: selektor pravi nov objekat, a zustand 5 bi ga inace crtao u krug.
  const v = useVideoPrice(useShallow((s) => ({
    moj: !!uid && s.uid === uid && s.dan === dan && !!s.stanje,
    stanje: s.stanje, napredak: s.napredak, uri: s.uri, sklonjen: s.sklonjen,
  })));
  return v.moj && v.stanje ? { stanje: v.stanje, napredak: v.napredak, uri: v.uri, sklonjen: v.sklonjen } : null;
}
