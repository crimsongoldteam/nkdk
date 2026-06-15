import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { MetadataConstantRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataConstant", () => {
  const name = "КонстантаВсеСвойства"

  it("ошибается на XML с common form в локальном Form metadataTarget", async () => {
    await expect(
      testConvertAppliedObjectFromXML({
        rule: MetadataConstantRules,
        name,
        importMetaUrl: import.meta.url,
        expectedYAML: "",
      })
    ).rejects.toThrow("Некорректный формат цели метаданных")
  })
})
