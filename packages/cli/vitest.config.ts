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
      "~": resolve(__dirname, "../core"),
      "nkdk-language": resolve(__dirname, "../language/src/index"),
    },
  },
})
