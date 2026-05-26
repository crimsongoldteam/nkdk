import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCommonModuleRules } from "./rules"

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n")

describe("syncAppliedObjectToXML — MetadataCommonModule", () => {
  it("читает CommonModule из YAML и записывает XML + модуль в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCommonModuleRules,
      name: "ОбщийМодульГлобальный",
      importMetaUrl: import.meta.url,
      externalObjectDir: true,
      expectedFiles: ["ОбщийМодульГлобальный.xml", "ОбщийМодульГлобальный/Ext/Module.bsl"],
    })

    for (const { path, result, expected } of comparisons) {
      expect(normalizeLineEndings(result), path).toBe(normalizeLineEndings(expected))
    }
  })
})
