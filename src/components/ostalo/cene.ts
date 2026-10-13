import { useCenaNatalneKarte, useCenaPitanja, useCenaSata, usePaketiPremium } from '@/lib/kupovina';
import { PROIZVODI, type ProizvodId } from '@/lib/proizvodi';
import { useT } from '@/i18n';
import { usePremium } from '@/store/auth';

/** Sta stoji u redu liste umesto cene: iznos, precrtana stara cena i sitan nastavak ("godisnje"). */
export type CenaReda = { cena: string; stara?: string; nastavak?: string };

/**
 * Cene za listu "Proizvodi" (Ivan, 14.10.2026: cene odmah u listi, sa probnim cenama dok ne stigne RevenueCat).
 *
 * U aplikaciji cena dolazi iz prodavnice (`lib/kupovina.ts`) i NIKAD se ne upisuje u kod (pravilo 8) — dok
 * RevenueCat ne stigne, probna postoji samo u razvoju i probnom buildu, a u produkciji red nema cenu (`null`) umesto
 * izmisljene. Cene sa sajta su prave i uvek tu (`lib/proizvodi.ts`). Widget je besplatan (to je cinjenica, ne cena).
 */
export function useCeneProizvoda(): Record<ProizvodId, CenaReda | null> {
  const t = useT().ostalo.proizvodi;
  const premium = usePremium();
  const godisnji = usePaketiPremium()?.find((p) => p.id === 'godisnje');
  const karta = useCenaNatalneKarte();
  const pitanje = useCenaPitanja(premium);
  const sat = useCenaSata();

  const izSajta = Object.fromEntries(
    PROIZVODI.filter((p) => p.cenaSajta).map((p) => [p.id, p.cenaSajta as CenaReda]),
  ) as Partial<Record<ProizvodId, CenaReda>>;

  return {
    widget: { cena: t.besplatno },
    premium: godisnji ? { cena: godisnji.cena, nastavak: t.godisnje } : null,
    natalna: karta ? { cena: karta } : null,
    sat: sat ? { cena: sat } : null,
    pitanje: pitanje ? { cena: pitanje } : null,
    narukvica: izSajta.narukvica ?? null,
    konsultacije30: izSajta.konsultacije30 ?? null,
    konsultacije90: izSajta.konsultacije90 ?? null,
  };
}
