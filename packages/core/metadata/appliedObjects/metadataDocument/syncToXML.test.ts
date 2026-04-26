import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataDocument", () => {
  it("читает Document из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentRules,
      name: "ДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ДокументВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
