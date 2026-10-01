/**
 * SLIKA PROFILA (Ivan, 29.9.2026): sa Google naloga, ili korisnik izabere svoju.
 *
 * Tri izvora, ovim redom:
 *   1. SVOJA slika — privatno skladiste `slike/<korisnik>/<vreme>.jpg`
 *      (`supabase/slike.sql`); putanja stoji u `user_metadata.slika`, pa ne treba
 *      nova kolona u `profiles`. Prikaz preko potpisanog linka (sat), kao snimci
 *      odgovora astrologa (pravilo 21).
 *   2. Slika NALOGA — Google je daje sam (`avatar_url` / `picture` u metapodacima).
 *      APPLE SLIKU NE DAJE NIKAD (Sign in with Apple ima samo ime i email), pa kod
 *      Apple naloga ostaju samo 1. i 3.
 *   3. Inicijali — bez slike ekran ne crta prazan krug.
 *
 * Vreme u imenu fajla menja kljuc kesa (`expo-image` pamti po `cacheKey`), pa
 * nova slika ne ceka da stara istekne iz kesa.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { User } from '@supabase/supabase-js';

import { tr } from '@/i18n/jezik';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

const KANTA = 'slike';
/** Stranica slike u pikselima — krug na ekranu je 88pt, x3 za najgusci ekran. */
const STRANA = 512;
const LINK_SEKUNDI = 60 * 60;

export type IzvorSlike =
  | { vrsta: 'svoja'; putanja: string }
  | { vrsta: 'nalog'; uri: string }
  | null;

/** Koja slika vazi za korisnika — cist izbor, bez mreze. */
export function izvorSlike(meta: Record<string, unknown> | undefined | null): IzvorSlike {
  const svoja = meta?.slika;
  if (typeof svoja === 'string' && svoja) return { vrsta: 'svoja', putanja: svoja };
  for (const k of ['avatar_url', 'picture']) {
    const uri = meta?.[k];
    if (typeof uri === 'string' && /^https:\/\//.test(uri)) return { vrsta: 'nalog', uri };
  }
  return null;
}

/** Inicijali za krug bez slike: "Ivan Krstić" -> "IK", "ivan" -> "I". */
export function inicijali(ime: string): string {
  const reci = ime.trim().split(/\s+/).filter(Boolean);
  return reci.slice(0, 2).map((r) => tr().gramatika.veliko(r[0]!)).join('');
}

/** `{ uri, cacheKey }` za `expo-image`, ili null dok nema slike. */
export function useSlikaProfila(): { uri: string; cacheKey: string } | null {
  const user = useAuthStore((s) => s.user);
  const izvor = izvorSlike(user?.user_metadata);
  const putanja = izvor?.vrsta === 'svoja' ? izvor.putanja : null;
  const link = useQuery({
    queryKey: ['slika-profila', putanja],
    enabled: !!putanja,
    staleTime: (LINK_SEKUNDI - 10 * 60) * 1000,
    gcTime: (LINK_SEKUNDI - 5 * 60) * 1000,
    queryFn: async (): Promise<string> => {
      const { data, error } = await supabase.storage.from(KANTA).createSignedUrl(putanja!, LINK_SEKUNDI);
      if (error || !data?.signedUrl) throw new Error(error?.message ?? 'nema linka');
      return data.signedUrl;
    },
  });
  if (izvor?.vrsta === 'nalog') return { uri: izvor.uri, cacheKey: izvor.uri };
  if (putanja && link.data) return { uri: link.data, cacheKey: putanja };
  return null;
}

/** Da li korisnik ima SVOJU sliku (tada meni nudi i "Ukloni"). */
export function imaSvojuSliku(user: User | null): boolean {
  return izvorSlike(user?.user_metadata)?.vrsta === 'svoja';
}

export type IshodSlike = 'promenjeno' | 'odustao' | 'bez-dozvole' | 'greska';

/**
 * Izbor slike iz galerije, isecanje na kvadrat, smanjenje na 512 JPEG i otprema.
 * Stara svoja slika se brise tek POSLE uspesnog upisa nove putanje — da korisnik
 * ne ostane bez slike ako otprema padne na pola.
 */
export function usePromeniSliku() {
  const qc = useQueryClient();
  return async function promeni(): Promise<IshodSlike> {
    const user = useAuthStore.getState().user;
    if (!user) return 'greska';

    // iOS 14+ bira kroz sistemski izbor fotografija bez dozvole; Android 13+ isto.
    // Pitanje za dozvolu ostaje za starije sisteme.
    const dozvola = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!dozvola.granted && dozvola.accessPrivileges !== 'limited') return 'bez-dozvole';

    const izbor = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (izbor.canceled || !izbor.assets[0]) return 'odustao';

    try {
      const slika = await ImageManipulator.manipulate(izbor.assets[0].uri)
        .resize({ width: STRANA, height: STRANA })
        .renderAsync();
      const sacuvano = await slika.saveAsync({ format: SaveFormat.JPEG, compress: 0.8, base64: true });
      const bajtovi = Uint8Array.from(atob(sacuvano.base64!), (c) => c.charCodeAt(0));

      const stara = izvorSlike(user.user_metadata);
      const putanja = `${user.id}/${Date.now()}.jpg`;
      const { error: greskaOtpreme } = await supabase.storage
        .from(KANTA)
        .upload(putanja, bajtovi, { contentType: 'image/jpeg', upsert: false });
      if (greskaOtpreme) return 'greska';

      const { error } = await supabase.auth.updateUser({ data: { slika: putanja } });
      if (error) {
        await supabase.storage.from(KANTA).remove([putanja]);
        return 'greska';
      }
      if (stara?.vrsta === 'svoja') await supabase.storage.from(KANTA).remove([stara.putanja]);
      qc.invalidateQueries({ queryKey: ['slika-profila'] });
      return 'promenjeno';
    } catch {
      return 'greska';
    }
  };
}

/** Ukloni svoju sliku — posle toga vazi slika naloga (Google) ili inicijali. */
export async function ukloniSliku(): Promise<boolean> {
  const user = useAuthStore.getState().user;
  const izvor = izvorSlike(user?.user_metadata);
  if (izvor?.vrsta !== 'svoja') return true;
  const { error } = await supabase.auth.updateUser({ data: { slika: null } });
  if (error) return false;
  await supabase.storage.from(KANTA).remove([izvor.putanja]);
  return true;
}
