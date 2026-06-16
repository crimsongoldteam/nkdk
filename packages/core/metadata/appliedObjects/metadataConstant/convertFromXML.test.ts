import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "~/tests/appliedObject"
import { readConstantYAML } from "./__fixtures__/sync/data"
import { MetadataConstantRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataConstant", () => {
  const name = "КонстантаВсеСвойства"

  it("читает XML с common form и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataConstantRules,
      name,
      importMetaUrl: import.meta.url,
      expectedYAML: readConstantYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
