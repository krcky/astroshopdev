/**
 * Panel za astrologa — zaseban mali veb (Vite + React), NIJE deo aplikacije.
 *
 *   npm run panel          razvoj na http://localhost:5180
 *   npm run panel:build    gotov sajt u panel/dist (za Cloudflare Pages)
 *
 * Kljucevi se citaju iz ISTOG `.env` kao aplikacija (`EXPO_PUBLIC_SUPABASE_URL`,
 * `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_TURNSTILE_SITE_KEY`) — svi su
 * javni (pravilo 9). Podatke stiti RLS: panel vidi pitanja samo nalogu iz
 * tabele `astrolozi` (`supabase/pitanja.sql`).
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PANEL = fileURLToPath(new URL('.', import.meta.url));
const KOREN = fileURLToPath(new URL('..', import.meta.url));

export default defineConfig({
  root: PANEL,
  envDir: KOREN,
  envPrefix: ['EXPO_PUBLIC_'],
  plugins: [react()],
  // Isti uvozi kao u aplikaciji (`@/lib/natal`…), da panel racuna kartu ISTIM kodom.
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  // Panel deli cist kod sa aplikacijom (`src/lib/pitanja-snimak.ts`, `mnozina.ts`,
  // `theme/tokens.ts`) — sve bez ijednog uvoza iz React Native-a.
  server: { port: 5180, strictPort: true, fs: { allow: [KOREN] } },
  build: { outDir: 'dist', emptyOutDir: true },
});
