module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      // MORA BITI POSLEDNJI u nizu.
      // Reanimated 4 kompajlira worklete preko ovog dodatka. Bez njega
      // useAnimatedStyle i withTiming ne bacaju gresku — samo tiho ne rade,
      // pa animacije stoje na pocetnoj vrednosti.
      'react-native-worklets/plugin',
    ],
  };
};
