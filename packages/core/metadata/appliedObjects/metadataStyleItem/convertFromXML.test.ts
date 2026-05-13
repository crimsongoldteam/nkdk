import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readStyleItemYAML } from "./__fixtures__/sync/data"
import { MetadataStyleItemRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataStyleItem", () => {
  it("читает StyleItem из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataStyleItemRules,
      name: "ЭлементСтиляШрифтВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readStyleItemYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
