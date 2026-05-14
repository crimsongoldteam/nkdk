import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonTemplateRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonTemplate", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonTemplateRules,
      name: "ТабличныйДокументВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ТабличныйДокументВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
