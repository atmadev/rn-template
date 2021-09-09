module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin',
		[
			'module-resolver',
			{
				root: ['./sources'],
				extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.json'],
				alias: {
					screens: './sources/screens',
					assets: './assets',
					components: './sources/components',
					navigation: './sources/navigation',
					shared: './shared'
				},
			},
		],],
  };
};
