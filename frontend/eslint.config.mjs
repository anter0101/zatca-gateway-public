import { FlatCompat } from "@eslint/eslintrc";
import checkFile from "eslint-plugin-check-file";
import importPlugin from "eslint-plugin-import";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"],
    plugins: ["react", "@typescript-eslint", "simple-import-sort"],
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-props-no-spreading": "off",
      "react/require-default-props": "off",
      curly: ["off"],
      "no-magic-numbers": "off",
      "react/jsx-filename-extension": [
        1,
        { extensions: [".js", ".jsx", ".ts", ".tsx"] },
      ],
      "react-hooks/exhaustive-deps": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-var": "error",
      "spaced-comment": ["warn", "always"],
      "prefer-const": "error",
      "no-invalid-this": "off",
      "default-case": "error",
      "react/no-unknown-property": ["error", { ignore: ["jsx", "global"] }],
      "simple-import-sort/imports": "warn",
      "simple-import-sort/exports": "warn",
      "@typescript-eslint/consistent-type-imports": "warn",
      curly: ["error", "all"],
      "no-magic-numbers": [
        "warn",
        { ignore: [0, 1], ignoreArrayIndexes: true, enforceConst: true },
      ],
    },
    overrides: [
      {
        files: ["**/*.js", "**/*.ts", "**/*.tsx"],
        rules: {
          "simple-import-sort/imports": [
            "warn",
            {
              groups: [
                // `react` first, `next` second, then packages starting with a character
                [
                  "^react$",
                  "^next",
                  "^[a-z]",
                  "^enums",
                  "^hooks",
                  "^utils/icons",
                  "^utils",
                  "^types",
                ],
                // Packages starting with `@`
                ["^@"],
                // Packages starting with `~`
                ["^~"],
                // Imports starting with `../`
                ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
                // Imports starting with `./`
                ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
                // Style imports
                ["^.+\\.s?css$"],
                // Side effect imports
                ["^\\u0000"],
              ],
            },
          ],
        },
      },
      {
        files: ["store/slices/**/*.ts"],
        // avoid state param assignment
        rules: { "no-param-reassign": ["error", { props: false }] },
      },
    ],
  }),
  // Bulletproof-react: file/folder naming and import structure
  {
    plugins: {
      "check-file": checkFile,
      import: importPlugin,
    },
    rules: {
      "check-file/filename-naming-convention": [
        "error",
        {
          "**/*.{ts,tsx}": "KEBAB_CASE",
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
      "check-file/folder-naming-convention": [
        "error",
        {
          "src/**/!(__tests__)": "KEBAB_CASE",
        },
      ],
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            // Unidirectional: features cannot import from app
            {
              target: "./src/features",
              from: "./src/app",
            },
            // Unidirectional: shared modules cannot import from app (may import from features for composition)
            {
              target: [
                "./src/components",
                "./src/hooks",
                "./src/lib",
                "./src/types",
                "./src/utils",
              ],
              from: ["./src/app"],
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
