import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataDocumentNumeratorRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataDocumentNumerator", () => {
  it("читает DocumentNumerator из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataDocumentNumeratorRules,
      name: "НумераторПоУмолчанию",
      importMetaUrl: import.meta.url,
      expectedFiles: ["НумераторПоУмолчанию.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
