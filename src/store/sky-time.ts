/**
 * Trenutak na ekranu "Trenutno na nebu", kad ga je korisnik pomerio.
 *
 * Store, a ne `useState` u ekranu, jer ga menja i list sa kalendarom
 * (`app/sky-datum.tsx`), koji je zaseban ekran (Ivan, 28.9.2026).
 *
 * BEZ `persist`, namerno: pomereno vreme vazi dok aplikacija radi. Posle
 * ponovnog pokretanja ekran opet pokazuje sadasnjost — inace bi korisnik
 * otvorio "Trenutno na nebu" i gledao nebo od pre tri dana.
 */
import { create } from 'zustand';

import { istiDanUKalendaru, izKalendara } from '@/lib/sky';
import type { TimeZoneInfo } from '@/lib/timezone';

type SkyTimeState = {
  /** null = ekran prati sat. Cim se vreme pomeri, trenutak se zamrzava. */
  izabran: Date | null;
  setIzabran: (d: Date | null) => void;
  /**
   * Dan iz kalendara (nosilac, `danZaKalendar`), uz zadrzan sat sa ekrana.
   * Danasnji dan dok ekran prati sat NE zamrzava vreme — izabrano je bas ono
   * sto se vec gleda.
   */
  izaberiDan: (nosilac: Date, tz: TimeZoneInfo) => void;
};

export const useSkyTimeStore = create<SkyTimeState>()((set, get) => ({
  izabran: null,
  setIzabran: (izabran) => set({ izabran }),
  izaberiDan: (nosilac, tz) => {
    const { izabran } = get();
    const trenutak = izabran ?? new Date();
    if (!izabran && istiDanUKalendaru(trenutak, tz, nosilac)) return;
    set({ izabran: izKalendara(trenutak, tz, nosilac) });
  },
}));
