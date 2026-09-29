import { AppState } from 'react-native';
import { create } from 'zustand';

import { dayKey } from '@/lib/transits';

/*
 * Danasnji dan za ekrane koji ostaju montirani (tabovi "Danas" i "Tranziti").
 *
 * Do 29.9.2026 su tabovi uzimali `new Date()` jednom, pri montiranju: aplikacija
 * ostavljena u pozadini preko noci je ujutru pokazivala jucerasnji "Tvoj dan"
 * dok se ne ugasi skroz (Ivan). Sada se dan proverava pri povratku u aplikaciju
 * i u lokalnu ponoc.
 *
 * Vrednost je TRENUTAK, ne ponoc — kao i ranije (`entries` su za trenutak
 * otvaranja). Menja se SAMO kad se promeni kalendarski dan; u toku dana ostaje
 * isti objekat, pa se racun ne ponavlja pri svakom povratku.
 */

/** Tajmer do ponoci ide u delovima: Android ne voli tajmere od vise sati. */
const NAJDUZE_MS = 60 * 60_000;

export const useDanasStore = create<{ danas: Date }>(() => ({ danas: new Date() }));

let tajmer: ReturnType<typeof setTimeout> | null = null;

function proveri() {
  const sada = new Date();
  if (dayKey(sada) !== dayKey(useDanasStore.getState().danas)) useDanasStore.setState({ danas: sada });
  zakazi(sada);
}

function zakazi(sada: Date) {
  if (tajmer) clearTimeout(tajmer);
  const ponoc = new Date(sada.getFullYear(), sada.getMonth(), sada.getDate() + 1);
  // Sekund posle ponoci: tajmer ume da okine koju milisekundu ranije.
  tajmer = setTimeout(proveri, Math.min(ponoc.getTime() - sada.getTime() + 1000, NAJDUZE_MS));
}

zakazi(new Date());
// U pozadini tajmeri stoje — povratak u aplikaciju je glavna provera.
AppState.addEventListener('change', (s) => { if (s === 'active') proveri(); });

/** Danasnji trenutak; nov objekat tek kad svane nov dan. */
export const useDanas = () => useDanasStore((s) => s.danas);
