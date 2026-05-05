import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["server/__tests__/**/*.test.ts", "shared/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "server/middleware/**/*.ts",
        "server/services/council/**/*.ts",
        "server/routes/auth.ts",
        "server/routes/totp.ts",
        "server/routes/api-keys.ts",
        "server/services/webhooks.ts",
      ],
      exclude: ["**/__tests__/**"],
    },
  },
  resolve: {
    alias: {
      "@shared": new URL("./shared", import.meta.url).pathname,
    },
  },
});
