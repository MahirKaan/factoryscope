// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@images': './assets/images',
            '@components': './components',
            '@contexts': './context',
            '@constants': './constants',
            '@assets': './assets',
            '@hooks': './hooks',
            '@screens': './app',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
