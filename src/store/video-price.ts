/**
 * VIDEO PRICE (Ivan, 30.9.2026): poslovi pravljenja videa i gotovi videi — PO JEDAN ZA SVAKU
 * VRSTU PRICE (dnevna, o znaku; 1.10.2026), da video znaka ne obrise dnevni i obrnuto.
 *
 *  - `posao`: ono sto radionica u korenu (`components/prica/video-radionica.tsx`) upravo crta,
 *    kadar po kadar, dok korisnik radi sta hoce. Najvise jedan u isto vreme. Ne ide na disk:
 *    posle ponovnog pokretanja aplikacije prekinut posao ne postoji.
 *  - `videi[vrsta]`: stanje i fajl te vrste. Gotov ide na disk (bez putanje — iOS pri azuriranju
 *    menja putanju kontejnera, pa se racuna iz imena), da traka i obavestenje vode na video i
 *    posle ponovnog pokretanja.
 *  - Dnevni video vazi SAMO ZA SVOJ DAN: cim dan prodje (pokretanje ili ponoc) fajl se brise.
 *    Video znaka vazi dok je znak isti (proverava ko ga cita, `useKljucVidea`).
 *  - `sklonjen`: traka iznad tabova vise ne stoji (video podeljen ili sklonjen); video i dalje
 *    postoji — u prici, na "Podeli" -> "Pogledaj video".
 *  - `poslednja`: vrsta poslednjeg pokrenutog videa — nju pokazuje traka iznad tabova.
 *
 * PRIPADA NALOGU, kao `prica-log.ts`: nosi `uid`, tudji se cita kao prazan, pri odjavi se brise
 * zajedno sa fajlovima (`store/auth.ts`).
 */
import type * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

import { dayKey } from '@/lib/transits';
import { useDanasStore } from '@/store/danas';

export type StanjeVidea = 'pravi' | 'gotov' | 'greska';
export type VrstaVidea = 'dan' | 'znak';

/** Sta se snima — samo dok se pravi (kartice su React elementi, ne idu na disk). */
export type PosaoVidea = {
  vrsta: VrstaVidea;
  /** Za koji sadrzaj: dan (`2026-10-01`) ili znak (`aries`). Isti kljuc = isti video. */
  kljuc: string;
  /** Ime fajla bez nastavka — vidi se u meniju za deljenje i u Galeriji ("Astro Shop Ovan"). */
  ime: string;
  /** "Priča dana", "Tvoj znak" — na traci i listu. */
  naslov: string;
  /** Prva recenica obavestenja: "Priča dana, Sre, 1. okt 2026." */
  opis: string;
  /** Trajanje svake slike u videu (ms), bez zavrsnog kadra; broj slika = duzina. */
  trajanja: number[];
  /** Kartica za deljenje slike `i` (360 × 640) — iz nje se pravi i kadar videa. */
  kartica: (i: number) => React.ReactElement;
};

export type Video = {
  kljuc: string;
  ime: string;
  naslov: string;
  stanje: StanjeVidea;
  /** 0—1, dok se pravi. */
  napredak: number;
  uri: string | null;
  sklonjen: boolean;
};

type State = {
  uid: string | null;
  videi: Partial<Record<VrstaVidea, Video>>;
  posao: PosaoVidea | null;
  poslednja: VrstaVidea | null;
  pokreni: (uid: string, posao: PosaoVidea) => void;
  javiNapredak: (x: number) => void;
  gotovo: (uri: string) => void;
  neuspeh: () => void;
  skloni: (vrsta: VrstaVidea) => void;
  obrisi: (vrsta: VrstaVidea) => void;
  clear: () => void;
};

/** Folder videa — po najvise jedan fajl za svaku vrstu price. */
export function folderVidea(): Directory {
  return new Directory(Paths.document, 'video-price');
}

export function fajlVidea(ime: string): File {
  return new File(folderVidea(), `${ime}.mp4`);
}

function obrisiFajl(ime: string | undefined) {
  if (!ime) return;
  try {
    const f = fajlVidea(ime);
    if (f.exists) f.delete();
  } catch { /* nista */ }
}

function obrisiFolder() {
  try {
    const d = folderVidea();
    if (d.exists) d.delete();
  } catch { /* nista */ }
}

/** Posle ponovnog pokretanja: sve sto nije gotov video (npr. pola fajla prekinutog posla) ide napolje. */
function pocistiOsim(imena: Set<string>) {
  try {
    const d = folderVidea();
    if (!d.exists) return;
    for (const f of d.list()) {
      if (f instanceof File && !imena.has(f.name)) f.delete();
    }
  } catch { /* nista */ }
}

export const useVideoPrice = create<State>()(
  persist(
    (set, get) => ({
      uid: null,
      videi: {},
      posao: null,
      poslednja: null,
      pokreni: (uid, posao) => {
        // Drugi nalog na istom telefonu ne nasledjuje tudje videe.
        const isti = get().uid === uid;
        if (!isti) obrisiFolder();
        const videi = isti ? { ...get().videi } : {};
        obrisiFajl(videi[posao.vrsta]?.ime);
        videi[posao.vrsta] = {
          kljuc: posao.kljuc, ime: posao.ime, naslov: posao.naslov, stanje: 'pravi', napredak: 0, uri: null, sklonjen: false,
        };
        set({ uid, videi, posao, poslednja: posao.vrsta });
      },
      javiNapredak: (napredak) => {
        const { posao, videi } = get();
        const v = posao ? videi[posao.vrsta] : undefined;
        if (!posao || v?.stanje !== 'pravi') return;
        set({ videi: { ...videi, [posao.vrsta]: { ...v, napredak } } });
      },
      gotovo: (uri) => {
        const { posao, videi } = get();
        const v = posao ? videi[posao.vrsta] : undefined;
        if (!posao || !v) return;
        set({ posao: null, videi: { ...videi, [posao.vrsta]: { ...v, stanje: 'gotov', napredak: 1, uri } } });
      },
      neuspeh: () => {
        const { posao, videi } = get();
        const v = posao ? videi[posao.vrsta] : undefined;
        if (!posao || !v) { set({ posao: null }); return; }
        set({ posao: null, videi: { ...videi, [posao.vrsta]: { ...v, stanje: 'greska' } } });
      },
      skloni: (vrsta) => {
        const v = get().videi[vrsta];
        if (v) set({ videi: { ...get().videi, [vrsta]: { ...v, sklonjen: true } } });
      },
      obrisi: (vrsta) => {
        const { videi, posao } = get();
        if (posao?.vrsta === vrsta) return;
        obrisiFajl(videi[vrsta]?.ime);
        const ostali = { ...videi };
        delete ostali[vrsta];
        set({ videi: ostali });
      },
      clear: () => {
        obrisiFolder();
        set({ uid: null, videi: {}, posao: null, poslednja: null });
      },
    }),
    {
      name: 'astroshop-video-price',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
      // Na disk samo gotovi videi, BEZ putanje (racuna se iz imena).
      partialize: (s) => {
        const videi: Partial<Record<VrstaVidea, Video>> = {};
        for (const [vrsta, v] of Object.entries(s.videi) as [VrstaVidea, Video][]) {
          if (v.stanje === 'gotov') videi[vrsta] = { ...v, uri: null };
        }
        return { uid: s.uid, videi, poslednja: s.poslednja } as any;
      },
      // Verzija 0 (do 1.10.2026) je imala jedan dnevni video bez imena — ne prenosi se; fajl
      // pocisti `pocistiOsim` ispod.
      migrate: () => ({ uid: null, videi: {}, poslednja: null }) as any,
      onRehydrateStorage: () => (s) => {
        if (!s) return;
        const videi: Partial<Record<VrstaVidea, Video>> = {};
        const danas = dayKey(new Date());
        for (const [vrsta, v] of Object.entries(s.videi ?? {}) as [VrstaVidea, Video][]) {
          // Jucerasnji dnevni video se brise; fajl je mogao i sam nestati (sistem cisti).
          if (v.stanje !== 'gotov' || (vrsta === 'dan' && v.kljuc !== danas)) continue;
          const f = fajlVidea(v.ime);
          if (f.exists) videi[vrsta] = { ...v, uri: f.uri };
        }
        pocistiOsim(new Set(Object.values(videi).map((v) => `${v!.ime}.mp4`)));
        useVideoPrice.setState({ videi });
      },
    }
  )
);

// Ponoc dok je aplikacija otvorena (`store/danas.ts`): gotov dnevni video od juce se brise. Posao
// koji upravo traje se ne dira — zavrsice se i pripasti danu za koji je poceo.
useDanasStore.subscribe(({ danas }) => {
  const v = useVideoPrice.getState().videi.dan;
  if (v && v.stanje !== 'pravi' && v.kljuc !== dayKey(danas)) useVideoPrice.getState().obrisi('dan');
});

/**
 * Video ove vrste za ovaj nalog i ovaj sadrzaj (dan, znak). Tudji ili za drugi sadrzaj se ne vidi;
 * greska vazi samo dok je aplikacija otvorena.
 */
export function useVideo(uid: string | null, vrsta: VrstaVidea, kljuc: string | null) {
  // `useShallow`: selektor pravi nov objekat, a zustand 5 bi ga inace crtao u krug.
  const v = useVideoPrice(useShallow((s) => {
    const x = s.videi[vrsta];
    return {
      moj: !!uid && !!kljuc && s.uid === uid && x?.kljuc === kljuc,
      stanje: x?.stanje ?? null, napredak: x?.napredak ?? 0, uri: x?.uri ?? null, sklonjen: x?.sklonjen ?? false,
      naslov: x?.naslov ?? '',
    };
  }));
  return v.moj && v.stanje
    ? { vrsta, stanje: v.stanje, napredak: v.napredak, uri: v.uri, sklonjen: v.sklonjen, naslov: v.naslov }
    : null;
}

export type VideoStanje = NonNullable<ReturnType<typeof useVideo>>;
