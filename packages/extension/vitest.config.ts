import { resolve } from "path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    watch: false,
    alias: {
      "@nakidka/graph": resolve(__dirname, "../graph/src/index.ts"),
      "~": resolve(__dirname, "../core"),
    },
  },
})
