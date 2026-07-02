import { describe, expect, it } from "vitest"
import { testConvertAppliedObjectFromXML } from "../../../tests/appliedObject"
import { readFunctionalOptionsParameterYAML } from "./__fixtures__/sync/data"
import { MetadataFunctionalOptionsParameterRules } from "./rules"

describe("convertAppliedObjectFromXML — MetadataFunctionalOptionsParameter", () => {
  it("читает FunctionalOptionsParameter из XML и записывает Свойства.yaml", async () => {
    const { yaml } = await testConvertAppliedObjectFromXML({
      rule: MetadataFunctionalOptionsParameterRules,
      name: "ПараметрФункциональныхОпцийВсеСвойства",
      importMetaUrl: import.meta.url,
      expectedYAML: readFunctionalOptionsParameterYAML,
    })

    expect(yaml.result).toBe(yaml.expected)
  })
})
