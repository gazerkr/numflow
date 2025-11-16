import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        // Removed project option - unnecessary as all type-aware rules are off
      },
      globals: {
        ...globals.node,
        ...globals.es2020,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // TypeScript ESLint recommended rules (baseline only)
      ...tsPlugin.configs.recommended.rules,

      // TypeScript specific overrides
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-explicit-any": "off", // Fully allow any (Express compatibility)
      "@typescript-eslint/no-unused-vars": "off", // Fully allow unused variables

      // Type safety rules (relaxed)
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",

      // Promise handling (relaxed) - type-aware rules don't work without project
      "@typescript-eslint/no-floating-promises": "off", // Fully allow
      "@typescript-eslint/no-misused-promises": "off", // Fully allow

      // Others
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-promise-reject-errors": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/unbound-method": "off",

      // General (relaxed)
      "no-console": "off", // Allow console.log (during development)
      "prefer-const": "off", // Allow let
      "no-var": "error", // Keep var prohibition
      "no-unused-vars": "off", // Allow unused variables
      "no-useless-escape": "off", // Allow unnecessary escapes
      "no-useless-catch": "off", // Allow unnecessary try/catch
      "no-undef": "off", // Allow undefined variables
      "no-self-assign": "off", // Allow self assignment
    },
  },

  // JavaScript files (test files in test/javascript/)
  {
    files: ["test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      "no-undef": "off",
      "no-console": "off",
      "no-unused-vars": "off",
      "no-self-assign": "off",
    },
  },

  // Ignore patterns
  {
    ignores: [
      "dist/",
      "coverage/",
      "node_modules/",
      "examples/",
      "benchmarks/",
      "test/__fixtures__/", // Test fixtures (may include .mjs, .mts files)
      "*.config.js",
      "*.config.cjs",
      "*.config.mjs",
      "jest.config.js",
    ],
  },
];
