import { describeAppliedObjectYAMLToXMLFixtures } from "../../../tests/appliedObject/unifiedFixtureConversion"
import { beforeAll, describe, expect, it } from "vitest"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { mockContext } from "../../../tests/mockContext"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"
import { testMetadataItemFromXMLToYAML } from "../../../tests/directConversion"
import { testMetadataItemFromYAMLToXML } from "../../../tests/directConversion"
import { importFromYAML } from "@nkdk/runtime"
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
  let schema: ReturnType<typeof compileValidationSchema>

  beforeAll(() => {
    schema = compileValidationSchema(exportMetadataEnumerationToJSONSchema({ context: mockContext }))
  })

  it("accepts enum value names from YAML keys and rejects invalid properties", () => {
    expect(schema.Check({ Значения: { Значение1: {} } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Синоним: "Синоним" } } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Имя: "Значение1" } } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Лишнее: "значение" } } })).toBe(false)
    expect(schema.Check({ Значения: { Значение1: { Имя: 1 } } })).toBe(false)
  })

  it("принимает пустое тело значения перечисления без фигурных скобок", () => {
    const yaml = importFromYAML("Значения:\n  ЗначениеA:")

    expect(schema.Check(yaml)).toBe(true)
    const result = testMetadataItemFromYAMLToXML({
      rule: MetadataEnumerationRules,
      name: "ТестовоеПеречисление",
      yaml,
    })
    expect(result.xml).toMatchObject({
      MetaDataObject: {
        Enum: {
          Properties: { Name: "ТестовоеПеречисление" },
          ChildObjects: {
            EnumValue: [
              expect.objectContaining({
                Properties: expect.objectContaining({ Name: "ЗначениеA" }),
              }),
            ],
          },
        },
      },
    })
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
