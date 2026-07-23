import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"
import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { MetadataEnumerationRules } from "./rules"
import { fullYAML } from "./__fixtures__/full"
import { minimalYAML } from "./__fixtures__/minimal"

const cases = [
  { fixture: "full.xml", yaml: fullYAML },
  { fixture: "minimal.xml", yaml: minimalYAML },
] as const

describeAppliedObjectYAMLToXMLFixtures({
  itemType: "MetadataEnumeration",
  rule: MetadataEnumerationRules,
  importMetaUrl: import.meta.url,
  cases,
  testTitle: "exports $fixture exactly",
})

describe("MetadataEnumeration YAML contract", () => {
  it("accepts enum value names from YAML keys and rejects invalid properties", () => {
    const schema = compileValidationSchema(exportMetadataEnumerationToJSONSchema({ context: mockContext }))

    expect(schema.Check({ Значения: { Значение1: {} } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Синоним: "Синоним" } } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Имя: "Значение1" } } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Лишнее: "значение" } } })).toBe(false)
    expect(schema.Check({ Значения: { Значение1: { Имя: 1 } } })).toBe(false)
  })

  it("omits enum value synonym equal to its YAML key presentation", () => {
    const result = testMetadataItemFromXMLToYAML({
      rule: MetadataEnumerationRules,
      name: "ABCКлассификация",
      xml: {
        Enum: {
          Properties: { Name: "ABCКлассификация" },
          ChildObjects: {
            EnumValue: {
              Properties: {
                Name: "ЗначениеA",
                Synonym: { "v8:item": { "v8:lang": "ru", "v8:content": "Значение A" } },
              },
            },
          },
        },
      },
    })

    expect(result.yaml).toMatchObject({ Значения: { ЗначениеA: {} } })
  })
})
