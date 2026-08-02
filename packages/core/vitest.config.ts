import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
const mutationTestFiles = process.env["NKDK_STRYKER_TEST_FILES"]?.split(",").filter(Boolean)

export default defineConfig({
  plugins: [],
  css: {
    // Без этого Vite ищет postcss.config.* в root и бросает (и ловит) «No PostCSS Config» —
    // при включённой остановке на caught exceptions отладчик всё равно останавливается.
    postcss: { plugins: [] },
  },
  test: {
    ...(mutationTestFiles === undefined ? {} : { include: mutationTestFiles }),
    environment: "node",
    globals: true,
    watch: false,
    maxWorkers: 1,
    // Source-mode worker tests запускают TypeScript через tsx; холодный запуск worker
    // на CI заметно дольше обычного модульного теста.
    testTimeout: 120_000,
    hookTimeout: 240_000,
    setupFiles: [
      resolve(__dirname, "./tests/forbidRealPiscina"),
      resolve(__dirname, "./tests/setupTests"),
    ],
    runner: process.env["NKDK_TEST_FILE_LIFECYCLE_EVENTS"] === undefined
      ? undefined
      : resolve(__dirname, "./scripts/test-file-lifecycle-runner.mjs"),
  },
})
