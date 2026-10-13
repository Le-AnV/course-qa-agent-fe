import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * Mirrors `tsconfig.json` paths (`@/*` -> `./*`) so tests can import app
 * modules the same way production code does. No plugins, no new deps.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": root,
    },
  },
});
