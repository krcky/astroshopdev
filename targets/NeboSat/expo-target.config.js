/**
 * Apple Watch aplikacija "Nebo sada": pun krug preko ekrana, kruna pomera vreme,
 * druga strana je lista planeta. Racun i crtez su u `native/SkyCore` (pravilo 27).
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'watch',
  name: 'NeboSat',
  displayName: 'Astro Shop',
  bundleIdentifier: '.watch',
  deploymentTarget: '10.0',
  icon: '../../assets/images/icon.png',
  colors: { $accent: '#B39DDB' },
  frameworks: ['SwiftUI', 'WatchConnectivity', 'WidgetKit'],
  // Ista grupa kao na telefonu (po imenu): sat u njoj cuva mesto za svoje komplikacije.
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
