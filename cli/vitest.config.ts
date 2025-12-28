import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "jsdom",
    globals: true,
    watch: false,
  },
})
