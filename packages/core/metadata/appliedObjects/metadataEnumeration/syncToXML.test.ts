import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataEnumerationRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataEnumeration", () => {
  it("читает Enum из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataEnumerationRules,
      name: "ПеречислениеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ПеречислениеВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
