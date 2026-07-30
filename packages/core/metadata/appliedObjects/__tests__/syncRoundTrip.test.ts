import { beforeAll, describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("applied object YAML -> XML sync", () => {
  const prepared = new Map<string, Awaited<ReturnType<typeof testSyncAppliedObjectToXML>>>()

  beforeAll(async () => {
    for (const { label, scenario, sync } of appliedObjectSyncCases) {
      prepared.set(
        label,
        await testSyncAppliedObjectToXML({
          rule: scenario.rule,
          name: sync.name,
          importMetaUrl: scenario.importMetaUrl,
          expectedFiles: [`${sync.name}.xml`],
          externalObjectDir: sync.externalObjectDir,
        })
      )
    }
  })

  it.each(appliedObjectSyncCases)("$label", ({ label }) => {
    const result = prepared.get(label)
    if (result === undefined) throw new Error(`Не подготовлен YAML → XML сценарий: ${label}`)
    const { comparisons, binaryComparisons } = result

    for (const { path, result, expected } of comparisons) {
      expect(normalizeText(result), path).toBe(normalizeText(expected))
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result, path).toEqual(expected)
    }
  })
})
