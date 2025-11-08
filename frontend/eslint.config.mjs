import nextConfig from "eslint-config-next";

export default [
	...nextConfig,
	{
		rules: {
			"react-hooks/immutability": "off",
			"react-hooks/set-state-in-effect": "off",
			"react-hooks/unsupported-syntax": "off",
			"react-hooks/exhaustive-deps": "off",
			"import/no-anonymous-default-export": "off",
		},
	},
];
