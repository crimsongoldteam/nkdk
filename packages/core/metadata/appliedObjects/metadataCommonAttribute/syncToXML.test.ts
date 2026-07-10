import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "../../../tests/appliedObject"
import { MetadataCommonAttributeRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonAttribute", () => {
  it("читает CommonAttribute из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonAttributeRules,
      name: "ОбщийРеквизитВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedFiles: ["ОбщийРеквизитВсеСвойства.xml"],
    })
    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
