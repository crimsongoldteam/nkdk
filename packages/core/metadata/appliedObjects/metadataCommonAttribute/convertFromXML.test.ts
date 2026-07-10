import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readCommonAttributeYAML } from "./__fixtures__/sync/data"
import { MetadataCommonAttributeRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataCommonAttribute", () => {
  it("читает CommonAttribute из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataCommonAttributeRules,
      name: "ОбщийРеквизитВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readCommonAttributeYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
