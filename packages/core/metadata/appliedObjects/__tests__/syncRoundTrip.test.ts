import { beforeAll, describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { canonicalXML } from "../../../tests/canonicalXML"
import { canonicalFormSyncXML } from "../../../tests/formSyncXML"
import { canonicalAccountingRegisterXML } from "./accountingRegisterXML"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

interface PreparedComparison {
  readonly path: string
  readonly result: unknown
  readonly expected: unknown
}

interface PreparedSyncCase {
  readonly comparisons: readonly PreparedComparison[]
  readonly binaryComparisons: Awaited<ReturnType<typeof testSyncAppliedObjectToXML>>["binaryComparisons"]
}

describe("applied object YAML -> XML sync", () => {
  const prepared = new Map<string, PreparedSyncCase>()

  beforeAll(async () => {
    for (const { label, scenario, sync } of appliedObjectSyncCases) {
      const result = await testSyncAppliedObjectToXML({
        rule: scenario.rule,
        name: sync.name,
        importMetaUrl: scenario.importMetaUrl,
        expectedFiles: [`${sync.name}.xml`],
        externalObjectDir: sync.externalObjectDir,
      })
      prepared.set(label, {
        comparisons: result.comparisons.map(({ path, result: actual, expected }) => {
          if (path.endsWith("/Ext/Form.xml")) {
            const form = canonicalFormSyncXML({ path, result: actual, expected, inputDir: result.inputDir })
            return { path, result: form.result, expected: form.expected }
          }
          if (path.endsWith(".xml")) {
            const canonical =
              scenario.group === "metadataAccountingRegister" ? canonicalAccountingRegisterXML : canonicalXML
            return { path, result: canonical(actual), expected: canonical(expected) }
          }
          return { path, result: normalizeText(actual), expected: normalizeText(expected) }
        }),
        binaryComparisons: result.binaryComparisons,
      })
    }
  })

  it.each(appliedObjectSyncCases)("$label", ({ label }) => {
    const result = prepared.get(label)
    if (result === undefined) throw new Error(`Не подготовлен YAML → XML сценарий: ${label}`)

    for (const comparison of result.comparisons) {
      expect(comparison.result, comparison.path).toEqual(comparison.expected)
    }
    for (const { path, result: actual, expected } of result.binaryComparisons) {
      expect(actual, path).toEqual(expected)
    }
  })
})
