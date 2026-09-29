/**
 * Pitanje dok se kuca — na telefonu, da ga slucajno povucen list ne obrise.
 *
 * Na server ide tek na "Nastavi na plaćanje" (`sacuvaj_nacrt`). Do tada postoji
 * samo ovde, vezano za nalog, i brise se pri odjavi (`store/auth.ts`) i posle
 * slanja. Nije onboarding draft (pravilo 12) — ovo korisnik pise svojim recima
 * i gubitak bi bio stvaran.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KLJUC = 'astroshop-pitanje-nacrt';

type Sacuvano = { uid: string; tekst: string };

export async function procitajLokalno(uid: string): Promise<string | null> {
  try {
    const s = await AsyncStorage.getItem(KLJUC);
    const v = s ? (JSON.parse(s) as Sacuvano) : null;
    return v && v.uid === uid ? v.tekst : null;
  } catch {
    return null;
  }
}

export async function upisiLokalno(uid: string, tekst: string): Promise<void> {
  try {
    if (tekst.trim()) await AsyncStorage.setItem(KLJUC, JSON.stringify({ uid, tekst } satisfies Sacuvano));
    else await AsyncStorage.removeItem(KLJUC);
  } catch { /* disk je rezerva, ne uslov */ }
}

export async function obrisiLokalno(): Promise<void> {
  try { await AsyncStorage.removeItem(KLJUC); } catch { /* nista */ }
}
