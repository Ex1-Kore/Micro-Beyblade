import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Presentation layer must not import Prisma directly (HTTP boundary app/api and
// data-access lib/* are exempt). Note: negated patterns inside `files` do NOT
// exclude in this @eslint/config-array version — use per-config `ignores`.
const prismaImportGuard = {
  files: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "modules/**/*.{ts,tsx}",
    "frontend/**/*.{ts,tsx}",
  ],
  ignores: ["app/api/**", "modules/**/lib/**"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@/lib/prisma",
            message:
              "Presentation code must not import Prisma directly. Use a lib service (e.g. lib/*-data) or the HTTP API. HTTP boundary (app/api) is exempt.",
          },
        ],
        patterns: [
          {
            group: ["**/lib/prisma"],
            message:
              "Presentation code must not import Prisma directly. Use a lib service (e.g. lib/*-data) or the HTTP API. HTTP boundary (app/api) is exempt.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prismaImportGuard,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Separate app (own manifest, lockfile, tsconfig and eslint config):
    "apps/**",
  ]),
]);

export default eslintConfig;
