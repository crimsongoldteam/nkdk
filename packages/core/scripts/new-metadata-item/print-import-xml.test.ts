import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, it } from "vitest"
import type { PropertyRule } from "~/metadata/orchestration"
import { testImportPropertyFromXML } from "~/tests/property/importPropertyFromXML"

const coreRoot = join(dirname(fileURLToPath(import.meta.url)), "../..")

/**
 * Печать результата `testImportPropertyFromXML` в stdout (JSON) для эталона в `data.ts`.
 * Удобно для коллекций: оборачивает содержимое XML-файла в корневой тег.
 *
 * Запуск из `packages/core`:
 * ```
 * NKDK_METADATA_PRINT_XML_PATH=metadata/commonObjects/.../__fixtures__/full.xml \
 * NKDK_METADATA_PRINT_XML_WRAPPER=MyFixturesRoot \
 * NKDK_METADATA_PRINT_XML_ROOT_TAG=MyFixturesRoot \
 * NKDK_METADATA_PRINT_RULE='{"type":"MyObject"}' \
 * pnpm vitest run scripts/new-metadata-item/print-import-xml.test.ts --run
 * ```
 *
 * Опционально: `NKDK_METADATA_PRINT_FOR_REFERENCE=true` — `mockContextFromXML({ forReference: true })`.
 *
 * Без обязательных переменных тест пропускается (не ломает общий `pnpm test`).
 */
describe("new-metadata-item: print-import-xml", () => {
  const envOk =
    Boolean(process.env.NKDK_METADATA_PRINT_XML_PATH) &&
    Boolean(process.env.NKDK_METADATA_PRINT_XML_WRAPPER) &&
    Boolean(process.env.NKDK_METADATA_PRINT_XML_ROOT_TAG) &&
    Boolean(process.env.NKDK_METADATA_PRINT_RULE)

  it.skipIf(!envOk)("prints importPropertyFromXML result to stdout", () => {
    const xmlPathRel = process.env.NKDK_METADATA_PRINT_XML_PATH!
    const wrapperTag = process.env.NKDK_METADATA_PRINT_XML_WRAPPER!
    const xmlRootTag = process.env.NKDK_METADATA_PRINT_XML_ROOT_TAG!
    const ruleJson = process.env.NKDK_METADATA_PRINT_RULE!

    const xmlInner = readFileSync(join(coreRoot, xmlPathRel), "utf-8")
    const xmlString = `<${wrapperTag}>${xmlInner}</${wrapperTag}>`
    const rule = JSON.parse(ruleJson) as PropertyRule
    const forReference = process.env.NKDK_METADATA_PRINT_FOR_REFERENCE === "true"

    const result = testImportPropertyFromXML({
      rule,
      xmlString,
      xmlRootTag,
      forReference,
    })
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(result, null, 2))
  })
})
