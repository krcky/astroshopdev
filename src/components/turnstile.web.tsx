/**
 * Turnstile na webu — ista kapija kao `turnstile.tsx`, bez WebView-a.
 *
 * ZASTO POSTOJI: `react-native-webview` nema implementaciju za web. Na webu se
 * ucitava njegov rezervni modul koji iscrta samo crveni tekst "does not support
 * this platform", nikakva poruka ne stigne nazad, i `getToken` istekne posle 25
 * sekundi. Korisnik to ne vidi — kapija je odgurnuta van ekrana — nego samo
 * ceka pa dobije gresku da nismo potvrdili da nije robot.
 *
 * Ironija je da je Turnstile web widget: ovde mu WebView ne treba uopste, crta
 * se pravo u DOM. Metro sam bira ovaj fajl kad je platforma web, pa se nijedna
 * postojeca linija ne dira.
 *
 * HOSTNAME: widget u Cloudflare-u prima samo domene sa svoje liste. Za razvoj u
 * pregledacu tamo mora da stoji i `localhost`, inace Cloudflare odbije izazov
 * iako je kod ispravan. Produkcija (`astroshop.rs`) se time ne menja.
 *
 * Ugovor je namerno isti kao kod native verzije — `{ gate, getToken }` plus
 * `isCaptchaEnabled` — da `account.tsx` ne zna na kojoj platformi radi.
 */
import * as React from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Koliko cekamo widget pre nego sto odustanemo. Isto kao na native strani. */
const TIMEOUT_MS = 25_000;

/** Koliko widget zivi posle callback-a, da stigne da posalje telemetriju. */
const UNMOUNT_DELAY_MS = 2_000;

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export const isCaptchaEnabled = SITE_KEY.length > 0;

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window { turnstile?: TurnstileApi }
}

/** Skripta se ucitava jednom po stranici; svaki sledeci poziv dobija isto obecanje. */
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadScript(): Promise<TurnstileApi> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('turnstile-no-dom'));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('turnstile-script'));
    };
    el.onerror = () => {
      // Da bi sledeci pokusaj mogao ponovo — mreza je mozda bila trenutni problem,
      // a blokator reklama ume da obori bas ovaj zahtev.
      scriptPromise = null;
      reject(new Error('turnstile-script'));
    };
    document.head.appendChild(el);
  });

  return scriptPromise;
}

export function useTurnstile() {
  const [run, setRun] = React.useState<number | null>(null);
  const [visible, setVisible] = React.useState(false);
  const host = React.useRef<HTMLDivElement | null>(null);
  const widgetId = React.useRef<string | null>(null);
  const pending = React.useRef<{
    resolve: (t: string | undefined) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonce = React.useRef(0);

  const clearWidget = React.useCallback(() => {
    const id = widgetId.current;
    widgetId.current = null;
    if (!id || !window.turnstile) return;
    // Widget ume da nestane sam kad se cvor ukloni; `remove` tada baca.
    try { window.turnstile.remove(id); } catch { /* vec ga nema */ }
  }, []);

  const settle = React.useCallback((fn: () => void) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    pending.current = null;
    setVisible(false);
    fn();

    // Isti razlog kao na native strani: Turnstile posle callback-a jos salje
    // telemetriju, pa se widget rusi tek kad prodje ovaj predah — i to samo ako
    // u medjuvremenu nije krenuo nov izazov.
    const id = nonce.current;
    setTimeout(() => {
      setRun((cur) => {
        if (cur !== id) return cur;
        clearWidget();
        return null;
      });
    }, UNMOUNT_DELAY_MS);
  }, [clearWidget]);

  const getToken = React.useCallback((): Promise<string | undefined> => {
    if (!isCaptchaEnabled) return Promise.resolve(undefined);
    return new Promise<string | undefined>((resolve, reject) => {
      pending.current = { resolve, reject };
      nonce.current += 1;
      setVisible(false);
      setRun(nonce.current);
      timer.current = setTimeout(() => {
        settle(() => reject(new Error('turnstile-timeout')));
      }, TIMEOUT_MS);
    });
  }, [settle]);

  // Crtanje ide tek kad `gate` postoji u stablu i `host` ima cvor.
  React.useEffect(() => {
    if (run === null) return;
    let otkazano = false;

    loadScript()
      .then((turnstile) => {
        if (otkazano || !host.current || !pending.current) return;
        clearWidget();
        host.current.innerHTML = '';
        widgetId.current = turnstile.render(host.current, {
          sitekey: SITE_KEY,
          callback: (t: string) => {
            const p = pending.current;
            if (p) settle(() => p.resolve(t));
          },
          'error-callback': (c: unknown) => {
            const p = pending.current;
            if (p) settle(() => p.reject(new Error(String(c))));
            return true;
          },
          'timeout-callback': () => {
            const p = pending.current;
            if (p) settle(() => p.reject(new Error('timeout')));
          },
          // Tek kad Managed rezim traži coveka widget se prikazuje; do tada
          // stoji van ekrana.
          'before-interactive-callback': () => setVisible(true),
        });
      })
      .catch((e: Error) => {
        const p = pending.current;
        if (p) settle(() => p.reject(e));
      });

    return () => { otkazano = true; };
  }, [run, settle, clearWidget]);

  React.useEffect(() => clearWidget, [clearWidget]);

  const gate = run === null ? null : (
    <View
      className={visible ? 'absolute inset-0 items-center justify-center bg-black/50' : 'absolute'}
      style={visible
        ? { zIndex: 1000 }
        : { left: -10_000, top: 0, width: 320, height: 90, opacity: 0, zIndex: -1 }}
      pointerEvents={visible ? 'auto' : 'none'}>
      <View className={visible ? 'items-center rounded-2xl border border-border bg-background px-6 py-5 shadow-lg' : ''}>
        {visible && (
          <Text variant="muted" className="mb-4 text-center text-sm">
            Samo da potvrdimo da nisi robot.
          </Text>
        )}
        {/* Cloudflare trazi pravi DOM cvor — zato raw div, a ne View. */}
        <div ref={host} style={{ width: 300, minHeight: 70 }} />
      </View>
    </View>
  );

  return { gate, getToken };
}
