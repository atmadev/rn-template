module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser
	parserOptions: {
		ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
		sourceType: 'module', // Allows for the use of imports
		ecmaFeatures: {
			jsx: true, // Allows for the parsing of JSX
		},
	},
	settings: {
		react: {
			version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
	extends: [
		'plugin:react/recommended', // Uses the recommended rules from @eslint-plugin-react
		'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
		'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
	],
	rules: {
		'@typescript-eslint/no-unused-expressions': 2,
		'@typescript-eslint/no-empty-function': 0,
		'@typescript-eslint/explicit-module-boundary-types': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/ban-types': 0,
		'@typescript-eslint/no-explicit-any': 2,
		'@typescript-eslint/ban-ts-comment': 0,
		'no-unused-expressions': 0,
		'no-use-before-define': 0,
		'no-undef': 0,
		'array-callback-return': 0,
		'react/prop-types': 0,
		'react/jsx-handler-names': 0,
		'react/jsx-indent': 0,
		'max-params': ['error', 4],
	},
}
