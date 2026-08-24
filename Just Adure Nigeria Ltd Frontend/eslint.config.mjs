import eslint from "@eslint/js";
import globals from "globals";

export default [
  { ignores: [".next/**", "coverage/**", "node_modules/**"] },
  eslint.configs.recommended,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest,
      },
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_|^[A-Z]", "varsIgnorePattern": "^[A-Z]" }],
    },
  },
];

