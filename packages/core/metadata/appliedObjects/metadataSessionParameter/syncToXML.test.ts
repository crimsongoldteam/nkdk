import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataSessionParameterRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataSessionParameter", () => {
  it("читает SessionParameter из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataSessionParameterRules,
      name: "ПараметрСеансаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПараметрСеансаВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
