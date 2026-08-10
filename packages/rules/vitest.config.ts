import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { configDefaults, defineConfig } from "vitest/config"

const __dirname = dirname(fileURLToPath(import.meta.url))
const coreMetadataTests = [
  "metadata/appliedObjects/**/*.test.ts",
  "metadata/commonObjects/metadataExternalDataSource*/**/*.test.ts",
  "metadata/commonObjects/metadataPath/**/*.test.ts",
  "metadata/components/**/*.test.ts",
  "metadata/configurationIndex/projectFiles.test.ts",
  "metadata/forms/clientApplicationForm/**/*.test.ts",
  "metadata/forms/commonObjects/scrollBarUse/**/*.test.ts",
  "metadata/forms/elements/**/*.test.ts",
  "metadata/fullSyncToXml/**/*.test.ts",
  "metadata/importFromXml/**/*.test.ts",
  "metadata/operations/**/*.test.ts",
  "metadata/project/**/*.test.ts",
  "metadata/projectDefinition/**/*.test.ts",
  "metadata/projectState/**/*.test.ts",
  "metadata/ruleRuntime/formElement/**/*.test.ts",
  "metadata/ruleRuntime/metadataItem/**/*.test.ts",
  "metadata/validation/**/*.test.ts",
]
const forbiddenPiscinaSetup = resolve(__dirname, "./tests/forbidRealPiscina")
const lightweightSetup = resolve(__dirname, "./tests/setupTests")

export default defineConfig({
  plugins: [],
  css: {
    // Без этого Vite ищет postcss.config.* в root и бросает (и ловит) «No PostCSS Config» —
    // при включённой остановке на caught exceptions отладчик всё равно останавливается.
    postcss: { plugins: [] },
  },
  test: {
    environment: "node",
    globals: true,
    watch: false,
    maxWorkers: 1,
    // Source-mode worker tests запускают TypeScript через tsx; холодный запуск worker
    // на CI заметно дольше обычного модульного теста.
    testTimeout: 120_000,
    hookTimeout: 240_000,
    projects: [
      {
        test: {
          name: "unit",
          exclude: [...configDefaults.exclude, ...coreMetadataTests],
          sequence: { groupOrder: 0 },
          setupFiles: [forbiddenPiscinaSetup, lightweightSetup],
        },
      },
      {
        test: {
          name: "core-metadata",
          include: coreMetadataTests,
          sequence: { groupOrder: 1 },
          setupFiles: [
            forbiddenPiscinaSetup,
            resolve(__dirname, "./tests/registerCoreMetadata"),
            lightweightSetup,
          ],
        },
      },
    ],
  },
})
