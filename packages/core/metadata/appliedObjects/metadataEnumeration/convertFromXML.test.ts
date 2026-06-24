import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readEnumerationYAML } from "./__fixtures__/sync/data"
import { MetadataEnumerationRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataEnumeration", () => {
  it("читает Enum из XML и записывает Свойства.yaml в outputDir", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataEnumerationRules,
      name: "ПеречислениеВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readEnumerationYAML,
    })
    expect(yaml.result).toBe(yaml.expected)
  })
})
