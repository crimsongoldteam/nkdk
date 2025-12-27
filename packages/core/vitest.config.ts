import UnpluginTypia from "@ryoppippi/unplugin-typia/vite"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [UnpluginTypia() as any],
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "jsdom",
    globals: true,
    watch: false,
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./"),
    },
  },
})
