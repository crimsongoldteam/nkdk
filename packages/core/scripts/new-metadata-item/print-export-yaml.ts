import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import type { PropertyRule } from "../../metadata/orchestration"
import { testExportPropertyToYAML } from "../../tests/property/exportPropertyToYAML"

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

const moduleRel = process.env.NKDK_METADATA_PRINT_MODULE
const exportName = process.env.NKDK_METADATA_PRINT_EXPORT
const ruleJson = process.env.NKDK_METADATA_PRINT_RULE

if (!moduleRel || !exportName || !ruleJson) {
  throw new Error(
    [
      "Нужно задать переменные окружения:",
      "NKDK_METADATA_PRINT_MODULE",
      "NKDK_METADATA_PRINT_EXPORT",
      "NKDK_METADATA_PRINT_RULE",
    ].join("\n")
  )
}

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
