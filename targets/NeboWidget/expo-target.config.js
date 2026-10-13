/**
 * Widget "Nebo sada" — astroloski krug sa trenutnim polozajima planeta.
 * Racun i crtez su u `native/SkyCore` (isti racun kao `src/lib`, `npm run check:skycore`).
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'widget',
  name: 'NeboWidget',
  displayName: 'Astro Shop',
  bundleIdentifier: '.widget',
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
  colors: {
    $accent: '#403F98',
    // Svetao kao aplikacija, crn u tamnom rezimu (kao na satu).
    $widgetBackground: { color: '#FFFFFF', darkColor: '#000000' },
  },
  // Ista App Group kao aplikacija (app.json, `ios.entitlements`) — bez nje widget ne vidi mesto
  // koje aplikacija upise. Mora da stoji OVDE: plugin je ne prenosi sam ako `entitlements` nema.
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
