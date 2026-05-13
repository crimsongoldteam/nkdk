import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataWSReferenceRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataWSReference", () => {
  it("читает WSReference из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataWSReferenceRules,
      name: "WSСсылкаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["WSСсылкаВсеСвойства.xml", "Ext/WSDefinition.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
