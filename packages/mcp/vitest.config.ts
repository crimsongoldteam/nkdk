import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10_000,
    watch: false,
  },
})
