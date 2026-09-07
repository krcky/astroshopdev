import * as React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useIsFocused } from 'expo-router';

import { NEAT_UMD_BASE64 } from '@/vendor/neat-umd';
import { FlowGradient, NEAT_CONFIG as FLOW_FALLBACK } from '@/components/flow-gradient';

/**
 * Prava @firecms/neat biblioteka, pokrenuta u WebView-u.
 *
 * Biblioteka crta u DOM <canvas> preko WebGL-a, cega u React Native-u nema.
 * WebView je jedini nacin da se koristi ONAKVA KAKVA JESTE, bez mog
 * priblizavanja sejderom.
 *
 * CENA: WebView je zasebna instanca pretrazivaca po ekranu. Za jednu pozadinu
 * je u redu; ako bi islo na sva cetiri taba odjednom, treba meriti memoriju.
 *
 * LICENCA: bez placenog kljuca biblioteka crta vodeni zig u svaki kadar
 * (`this._licensed || this._renderWatermark(n)`). Kljuc se vezuje za domen,
 * koji mobilna aplikacija nema — mora se resiti pre izlaska.
 */

export type NeatColor = { color: string; enabled: boolean };

export type NeatConfig = {
  colors: NeatColor[];
  [key: string]: unknown;
};

function buildHtml(config: NeatConfig): string {
  return `<!doctype html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<style>
  html,body{margin:0;padding:0;height:100%;overflow:hidden;background:transparent}
  #g{display:block;width:100vw;height:100vh}
</style></head>
<body><canvas id="g"></canvas>
<script>
(function () {
  // Biblioteka ide kroz base64 da backtick-ovi i \${...} u njenom izvoru
  // ne bi morali da se bekslesuju.
  var s = document.createElement('script');
  s.textContent = decodeURIComponent(escape(atob('${NEAT_UMD_BASE64}')));
  document.head.appendChild(s);

  try {
    new neat.NeatGradient(Object.assign(
      { ref: document.getElementById('g') },
      ${JSON.stringify(config)}
    ));
  } catch (e) {
    window.ReactNativeWebView && window.ReactNativeWebView.postMessage('NEAT_ERROR: ' + e.message);
  }
})();
</script></body></html>`;
}

type Props = { config: NeatConfig; active?: boolean };

export function NeatGradientView({ config, active = true }: Props) {
  const html = React.useMemo(() => buildHtml(config), [config]);

  // react-native-webview ne postoji na vebu. Da veb pregled ne bi prikazivao
  // traku sa greskom, tamo ide nas sopstveni sejder kao zamena.
  if (Platform.OS === 'web') {
    return <FlowGradient config={FLOW_FALLBACK} active={active} />;
  }

  // Kad ekran nije u fokusu WebView se sklanja iz stabla — inace nastavlja da
  // crta i trosi bateriju iza drugog taba.
  if (!active) return <View style={StyleSheet.absoluteFill} pointerEvents="none" />;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <WebView
        source={{ html }}
        originWhitelist={['*']}
        style={styles.web}
        containerStyle={styles.fill}
        scrollEnabled={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        // Pozadina ne sme da hvata dodire — sav UI je iznad nje.
        pointerEvents="none"
        androidLayerType="hardware"
        // Bez ovoga iOS na prvi dodir zumira sadrzaj WebView-a.
        automaticallyAdjustContentInsets={false}
        onMessage={(e) => console.warn('[neat]', e.nativeEvent.data)}
        {...(Platform.OS === 'android' ? { mixedContentMode: 'always' as const } : null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: 'transparent' },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
});

/** Konfiguracija koju si poslao, netaknuta. */
export const NEAT_CONFIG: NeatConfig = {
  colors: [
    { color: '#167CB3', enabled: true },
    { color: '#CB9854', enabled: true },
    { color: '#CE96CE', enabled: true },
    { color: '#E0115F', enabled: true },
    { color: '#FFFFFF', enabled: false },
    { color: '#000000', enabled: false },
  ],
  speed: 2.5,
  horizontalPressure: 5,
  verticalPressure: 5,
  waveFrequencyX: 2,
  waveFrequencyY: 3,
  waveAmplitude: 6,
  secondaryWaveEnabled: false,
  shadows: 2,
  highlights: 0,
  colorBrightness: 0.9,
  colorSaturation: -3,
  wireframe: false,
  antialias: false,
  colorBlending: 5,
  backgroundColor: '#A1A4B7',
  backgroundAlpha: 1,
  resolution: 0.4,
  yOffsetWaveMultiplier: 1,
  yOffsetColorMultiplier: 4.8,
  yOffsetFlowMultiplier: 5.3,
  flowDistortionA: 3.7,
  flowDistortionB: 0.8,
  flowScale: 1.6,
  flowEase: 0.32,
  flowEnabled: true,
  domainWarpEnabled: true,
  domainWarpIntensity: 0.1,
  domainWarpScale: 2.4,
  vignetteIntensity: 0.45,
  vignetteRadius: 0.55,
  bloomIntensity: 1.9,
  bloomThreshold: 0.6,
  chromaticAberration: 17,
  shapeType: 'ribbon',
  shapeRotationX: 0.348,
  shapeRotationY: -26.783,
  shapeRotationZ: -0.29,
  planeBend: 2.3,
  planeTwist: -2.9,
  ribbonFade: 0.31,
  silhouetteFade: 0.83,
  cameraRotationX: 2.338,
  cameraRotationY: 1.883,
  cameraZoom: 1,
};

export function NeatBackground({ config = NEAT_CONFIG }: { config?: NeatConfig }) {
  const focused = useIsFocused();
  return <NeatGradientView config={config} active={focused} />;
}
