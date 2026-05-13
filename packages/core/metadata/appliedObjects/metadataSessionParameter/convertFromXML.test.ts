import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readSessionParameterYAML } from "./__fixtures__/sync/data"
import { MetadataSessionParameterRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataSessionParameter", () => {
  it("читает SessionParameter из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataSessionParameterRules,
      name: "ПараметрСеансаВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readSessionParameterYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
