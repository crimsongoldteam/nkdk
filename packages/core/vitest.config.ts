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
    environment: "node", // Используем node вместо jsdom для большинства тестов (ускоряет выполнение в ~5000 раз)
    globals: true,
    watch: false,
    // Параллельное выполнение тестов включено по умолчанию в vitest
  },
  resolve: {
    alias: {
      "~": resolve(__dirname, "./"),
    },
  },
})
