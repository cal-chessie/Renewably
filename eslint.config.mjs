import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  rules: {
    // Two tiers. Correctness rules that catch real bugs are "warn" so they
    // surface in `bun run lint` without failing the build (Next 16 does not run
    // ESLint during `next build`). Pure style/formatting rules that would flood
    // the log without changing behaviour stay off.

    // Correctness — catch real bugs (warn, not error, to avoid churn):
    "react-hooks/exhaustive-deps": "warn",        // stale-closure bugs in hooks
    "@next/next/no-html-link-for-pages": "warn",  // internal nav should use next/link
    "@next/next/no-img-element": "warn",          // prefer next/image for optimisation
    "no-unreachable": "warn",                     // dead code after return/throw
    "no-fallthrough": "warn",                     // accidental switch fallthrough
    "prefer-const": "warn",                       // let that is never reassigned

    // Style / noise — intentionally off:
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "@typescript-eslint/no-unused-disable-directive": "off",
    "react-hooks/purity": "off",
    "react-hooks/set-state-in-effect": "off",
    "react/no-unescaped-entities": "off",
    "react/display-name": "off",
    "react/prop-types": "off",
    "react-compiler/react-compiler": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "no-debugger": "off",
    "no-empty": "off",
    "no-irregular-whitespace": "off",
    "no-case-declarations": "off",
    "no-mixed-spaces-and-tabs": "off",
    "no-redeclare": "off",
    "no-undef": "off",
    "no-useless-escape": "off",
  },
}, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "examples/**", "skills", ".zscripts/**", "_TRASH/**"]
}];

export default eslintConfig;
