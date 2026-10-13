/**
 * Komplikacije za Apple Watch (i Smart Stack): isti prikazi kao widget na
 * zakljucanom ekranu telefona — `NeboPrikaz` u SkyCore.
 *
 * @type {import('@bacons/apple-targets/app.plugin').ConfigFunction}
 */
module.exports = (config) => ({
  type: 'watch-widget',
  name: 'NeboSatWidget',
  displayName: 'Astro Shop',
  bundleIdentifier: '.watch.widget',
  deploymentTarget: '10.0',
  colors: { $accent: '#B39DDB', $widgetBackground: '#000000' },
  frameworks: ['SwiftUI', 'WidgetKit'],
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
});
