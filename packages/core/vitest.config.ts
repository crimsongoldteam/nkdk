import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [],
  css: {
    // Без этого Vite ищет postcss.config.* в root и бросает (и ловит) «No PostCSS Config» —
    // при включённой остановке на caught exceptions отладчик всё равно останавливается.
    postcss: { plugins: [] },
  },
  esbuild: {
    target: "es2020",
  },
  test: {
    environment: "node",
    globals: true,
    watch: false,
    setupFiles: [resolve(__dirname, "./tests/setupTests")],
    server: {
      deps: {
        // langium is ESM-only; inline it to avoid CJS require path in Vitest.
        inline: ["langium"],
      },
    },
    alias: {
      "~": resolve(__dirname, "./"),
      "nkdk-language": resolve(__dirname, "../language/src/index"),
    },
  },
})
