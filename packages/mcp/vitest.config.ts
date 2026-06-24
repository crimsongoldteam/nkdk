import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    testTimeout: 10_000,
    watch: false,
    alias: {
      "~": resolve(__dirname, "../core"),
    },
  },
})
