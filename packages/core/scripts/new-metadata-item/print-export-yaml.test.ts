import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { describe, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testExportPropertyToYAML } from "~/tests/property/exportPropertyToYAML"

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

/**
 * Печать результата `testExportPropertyToYAML` в stdout (JSON) для переноса в `__fixtures__/data.ts`.
 *
 * Запуск из `packages/core`:
 * ```
 * NKDK_METADATA_PRINT_MODULE=metadata/commonObjects/.../__fixtures__/data.ts \
 * NKDK_METADATA_PRINT_EXPORT=fullMyObject \
 * NKDK_METADATA_PRINT_RULE='{"type":"MyObject","yaml":"КлючYAML"}' \
 * pnpm vitest run scripts/new-metadata-item/print-export-yaml.test.ts --run
 * ```
 *
 * Без этих переменных тест пропускается (не ломает общий `pnpm test`).
 */
describe("new-metadata-item: print-export-yaml", () => {
  const envOk =
    Boolean(process.env.NKDK_METADATA_PRINT_MODULE) &&
    Boolean(process.env.NKDK_METADATA_PRINT_EXPORT) &&
    Boolean(process.env.NKDK_METADATA_PRINT_RULE)

  it.skipIf(!envOk)("prints exportPropertyToYAML result to stdout", async () => {
    const moduleRel = process.env.NKDK_METADATA_PRINT_MODULE!
    const exportName = process.env.NKDK_METADATA_PRINT_EXPORT!
    const ruleJson = process.env.NKDK_METADATA_PRINT_RULE!

    const absModule = join(coreRoot, moduleRel)
    const mod = (await import(pathToFileURL(absModule).href)) as Record<string, unknown>
    const value = mod[exportName]
    if (value === undefined) {
      throw new Error(`В модуле нет экспорта «${exportName}»`)
    }

    const rule = JSON.parse(ruleJson) as PropertyRule
    const result = testExportPropertyToYAML({ rule, value })
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2))
  })
})
