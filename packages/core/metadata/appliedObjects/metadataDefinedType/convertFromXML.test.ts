import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readDefinedTypeYAML } from "./__fixtures__/sync/data"
import { MetadataDefinedTypeRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataDefinedType", () => {
  it("читает DefinedType из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataDefinedTypeRules,
      name: "ОпределяемыйТипВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readDefinedTypeYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
