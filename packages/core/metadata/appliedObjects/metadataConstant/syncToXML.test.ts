import { describe, expect, it } from "vitest"
import { testSyncAppliedObjectToXML } from "~/tests/appliedObject"
import { MetadataConstantRules } from "./rules"

describe("syncAppliedObjectToXML — MetadataConstant", () => {
  it("ошибается на YAML с common form в локальном Form metadataTarget", async () => {
    await expect(
      testSyncAppliedObjectToXML({
        rule: MetadataConstantRules,
        name: "КонстантаВсеСвойства",
        importMetaUrl: import.meta.url,
        expectedFiles: [
          "КонстантаВсеСвойства.xml",
          "Ext/ManagerModule.bsl",
          "Ext/ValueManagerModule.bsl",
        ],
      })
    ).rejects.toThrow("Некорректный формат цели метаданных")
  })
})
