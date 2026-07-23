import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { appliedObjectSyncCases } from "./yamlFixtures"

const normalizeText = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trimEnd()

describe("applied object YAML -> XML sync", () => {
  it.each(appliedObjectSyncCases)("$label", async ({ scenario, sync }) => {
    const { comparisons, binaryComparisons } = await testSyncAppliedObjectToXML({
      rule: scenario.rule,
      name: sync.name,
      importMetaUrl: scenario.importMetaUrl,
      expectedFiles: [`${sync.name}.xml`],
      externalObjectDir: sync.externalObjectDir,
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeText(result), path).toBe(normalizeText(expected))
    }
    for (const { path, result, expected } of binaryComparisons) {
      expect(result, path).toEqual(expected)
    }
  })
})
