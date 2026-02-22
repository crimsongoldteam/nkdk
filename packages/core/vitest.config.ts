import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [],
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    watch: false,
    setupFiles: [resolve(__dirname, "./tests/setupTests.ts")],
    alias: {
      "~": resolve(__dirname, "./"),
      "nkdk-language": resolve(__dirname, "../language/src/index.ts"),
    },
  },
})
