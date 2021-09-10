module.exports = {
	parser: '@typescript-eslint/parser', // Specifies the ESLint parser

	settings: {
		react: {
			version: 'detect', // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
	extends: ['standard', 'standard-react', 'prettier'],
	plugins: ['@typescript-eslint', 'prettier', 'react-hooks'],

	rules: {
		'@typescript-eslint/no-unused-expressions': 2,
		'@typescript-eslint/no-empty-function': 0,
		'@typescript-eslint/explicit-module-boundary-types': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/ban-types': 0,
		'@typescript-eslint/no-explicit-any': 2,
		'@typescript-eslint/ban-ts-comment': 0,
		'@typescript-eslint/no-explicit-any': 0, //TODO: remove
		'no-unused-vars': 0,
		'no-unused-expressions': 0,
		'no-use-before-define': 0,
		'no-undef': 0,
		'array-callback-return': 0,
		'react/prop-types': 0,
		'react/jsx-handler-names': 0,
		'react/jsx-indent': 0,
		'max-params': ['error', 4],
		'react/display-name': 0,
		// '@typescript-eslint/no-namespace': 0,
	},
}
