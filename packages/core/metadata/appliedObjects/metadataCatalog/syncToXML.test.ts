import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataCatalogRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataCatalog", () => {
  it("читает Catalog из YAML и записывает XML в outputDir", async () => {
    const { comparisons } = await testSyncAppliedObjectToXML({
      rule: MetadataCatalogRules,
      name: "СправочникCоВсемиОбъектами",
      importMetaUrl: import.meta.url,
      expectedFiles: [
        "СправочникCоВсемиОбъектами.xml",
        "Ext/Predefined.xml",
        "Ext/AdditionalIndexes.xml",
        "Ext/ObjectModule.bsl",
        "Ext/ManagerModule.bsl",
        "Ext/Help.xml",
        "Ext/Help/ru.html",
        "Commands/КомандаОбъекта/Ext/CommandModule.bsl",
      ],
    })
    for (const { path, result, expected } of comparisons) {
      expect(result, path).toBe(expected)
    }
  })
})
