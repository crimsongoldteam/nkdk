import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataStyleRules } from "./rules"

const normalizeXML = (value: string): string => value.replace(/\r\n/g, "\n").trimEnd()

describe("syncAppliedObjectToXML — MetadataStyle", () => {
  it("читает YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataStyleRules,
      name: "СтильВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["СтильВсеСвойства.xml", "СтильВсеСвойства/Ext/Style.xml"],
      externalObjectDir: true,
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeXML(result), path).toBe(normalizeXML(expected))
    }
  })
})
