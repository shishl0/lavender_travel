import next from "eslint-config-next";

export default [
  ...next,

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",

      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }
      ],

      "@next/next/no-img-element": "warn",

      "prefer-const": "warn",
    },
  },

  {
    ignores: ["**/.next/**", "**/node_modules/**", "public/cms-snapshot.json"],
  },
];