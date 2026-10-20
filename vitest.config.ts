import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

// Unit tests determinísticos (sem app, sem rede). Alias "@" -> src para os
// mesmos imports do app.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
