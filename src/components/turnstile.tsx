/**
 * Turnstile — dokaz da prijavu trazi covek, a ne skripta.
 *
 * ZASTO: anon kljuc je javan (pravilo 9), pa svako ko raspakuje aplikaciju moze
 * da zove /auth/v1/otp sa tudjim adresama. Svaki takav poziv salje pravi mejl sa
 * astroshop.rs nekom ko ga nije trazio. Steta nije racun (mejl je 0.13 centi)
 * nego reputacija domena — i to sto potrosen rate limit zakljucava PRAVE
 * korisnike, jer je limit globalan za projekat, a ne po IP adresi.
 *
 * ZASTO WEBVIEW: Turnstile je web widget i nema native SDK. Crtamo ga u
 * WebView-u kome je origin postavljen na https://astroshop.rs preko `baseUrl` —
 * taj hostname je upisan u widget u Cloudflare-u i mora da se poklopi.
 *
 * KORISCENJE:
 *   const captcha = useTurnstile();
 *   const captchaToken = await captcha.getToken();
 *   await supabase.auth.signInWithOtp({ email, options: { captchaToken } });
 *   ...
 *   {captcha.gate}          <- mora biti negde u stablu, inace nema ko da crta
 *
 * Token je JEDNOKRATAN i vazi oko pet minuta, pa se trazi neposredno pre poziva,
 * nikad unapred i nikad dvaput. Svaki `getToken` remontira WebView (menja se
 * `key`), da widget krene iz cista i vrati nov token.
 *
 * DOK KLJUCA NEMA, KAPIJE NEMA: ako EXPO_PUBLIC_TURNSTILE_SITE_KEY nije
 * postavljen, `getToken` vraca undefined i prijava radi kao i do sada. Zato se
 * ukljucuje jednom promenljivom, a razvoj ne zavisi od mreze ka Cloudflare-u.
 *
 * REDOSLED UKLJUCIVANJA: prvo ovo mora da radi u dev buildu, pa tek onda CAPTCHA
 * prekidac u Supabase-u. Obrnuto obara svaku prijavu — server trazi token koji
 * aplikacija jos ne salje.
 */
import * as React from 'react';
import { View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Text } from '@/components/ui/text';

const SITE_KEY = process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY ?? '';

/** Hostname upisan u widget u Cloudflare-u. WebView mora da se predstavi isto. */
const ORIGIN = 'https://astroshop.rs';

/** Koliko cekamo widget pre nego sto odustanemo. Cloudflare obicno odgovori za <2s. */
const TIMEOUT_MS = 25_000;

/** Koliko widget zivi posle callback-a, da stigne da posalje telemetriju. */
const UNMOUNT_DELAY_MS = 2_000;

export const isCaptchaEnabled = SITE_KEY.length > 0;

type Msg =
  | { type: 'token'; token: string }
  | { type: 'error'; code: string }
  | { type: 'interactive' };

function page(): string {
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
<style>
  html,body { margin:0; padding:0; background:transparent;
              display:flex; align-items:center; justify-content:center; }
</style>
<script>
  function send(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  // Mora da postoji PRE nego sto se api.js izvrsi — zato je ovaj blok iznad njega.
  function onTurnstileLoad() {
    turnstile.render('#widget', {
      sitekey: ${JSON.stringify(SITE_KEY)},
      callback: function (t) { send({ type: 'token', token: t }); },
      'error-callback': function (c) { send({ type: 'error', code: String(c) }); return true; },
      'timeout-callback': function () { send({ type: 'error', code: 'timeout' }); },
      // Javlja se kad Managed rezim proceni da mu treba covek. Tek tada
      // prikazujemo WebView; do tada je sklonjen sa ekrana.
      'before-interactive-callback': function () { send({ type: 'interactive' }); },
    });
  }
</script>
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit" async defer></script>
</head><body><div id="widget"></div></body></html>`;
}

export function useTurnstile() {
  const [run, setRun] = React.useState<number | null>(null);
  const [visible, setVisible] = React.useState(false);
  const pending = React.useRef<{
    resolve: (t: string | undefined) => void;
    reject: (e: Error) => void;
  } | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonce = React.useRef(0);

  const settle = React.useCallback((fn: () => void) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    pending.current = null;
    setVisible(false);
    fn();

    // WebView se NE rusi odmah. Turnstile posle callback-a jos salje telemetriju
    // Cloudflare-u; trenutni unmount je prekine, pa izazov u analitici ostane
    // zaveden kao "issued" a nikad "solved" — iako je token ispravan.
    // Gasimo tek ako u medjuvremenu nije krenuo nov izazov.
    const id = nonce.current;
    setTimeout(() => setRun((cur) => (cur === id ? null : cur)), UNMOUNT_DELAY_MS);
  }, []);

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

  const onMessage = React.useCallback((e: WebViewMessageEvent) => {
    let msg: Msg;
    try { msg = JSON.parse(e.nativeEvent.data) as Msg; } catch { return; }

    if (msg.type === 'interactive') { setVisible(true); return; }

    const p = pending.current;
    if (!p) return;
    if (msg.type === 'token') settle(() => p.resolve(msg.token));
    else settle(() => p.reject(new Error(msg.code)));
  }, [settle]);

  const gate = run === null ? null : (
    <View
      // Dok Cloudflare ne trazi coveka, widget je sklonjen van ekrana umesto da
      // ima nultu velicinu — nula bi ga sprecila da se uopste iscrta.
      className={visible ? 'absolute inset-0 items-center justify-center bg-black/50' : 'absolute'}
      // zIndex i elevation drze kapiju iznad forme i na iOS-u i na Androidu —
      // sam redosled u stablu nije dovoljan kad roditelj ima svoje slojeve.
      style={visible
        ? { zIndex: 1000, elevation: 1000 }
        : { left: -10_000, top: 0, width: 320, height: 90, opacity: 0, zIndex: -1 }}
      pointerEvents={visible ? 'auto' : 'none'}>
      <View className={visible ? 'items-center rounded-2xl border border-border bg-background px-6 py-5 shadow-lg' : ''}>
        {visible && (
          <Text variant="muted" className="mb-4 text-center text-sm">
            Samo da potvrdimo da nisi robot.
          </Text>
        )}
        <WebView
          key={run}
          source={{ html: page(), baseUrl: ORIGIN }}
          onMessage={onMessage}
          originWhitelist={['*']}
          javaScriptEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          style={{ width: 300, height: 70, backgroundColor: 'transparent' }}
        />
      </View>
    </View>
  );

  return { gate, getToken };
}
