import { describe, expect, it } from "vitest"
import Schema from "typebox/schema"
import { testExportAppliedObjectToYAML } from "../../../tests/appliedObject"
import { mockContext } from "../../../tests/mockContext"
import { full, fullYAML } from "./__fixtures__/full"
import { minimal, minimalYAML } from "./__fixtures__/minimal"
import { importMetadataEnumerationFromYAML } from "./fromYAML"
import { MetadataEnumerationRules } from "./rules"
import { exportMetadataEnumerationToJSONSchema } from "./toJSONSchema"

describe("import MetadataEnumeration from YAML", () => {
  it("imports undefined", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, undefined, "СтатусЗаказа")
    expect(result).toBeUndefined()
  })

  it("imports full fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    expect(result).toEqual(full)
  })

  it("imports minimal fixture", () => {
    const result = importMetadataEnumerationFromYAML(mockContext, minimalYAML, "ПеречислениеПоУмолчанию")
    const { synonym: _synonym, ...expected } = minimal
    expect(result).toEqual(expected)
  })

  it("round-trip: full — import затем export даёт тот же YAML (parsed)", () => {
    const imported = importMetadataEnumerationFromYAML(mockContext, fullYAML, "ПеречислениеВсеСвойства")
    const exported = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: imported,
    })
    expect(exported).toEqual(fullYAML)
  })

  it("omits enum value synonym equal to the value name", () => {
    const exported = testExportAppliedObjectToYAML({
      rule: MetadataEnumerationRules,
      data: {
        name: "ABCКлассификация",
        enumValues: [
          {
            name: "ЗначениеA",
            synonym: { items: { ru: "Значение A" } },
          },
        ],
      },
    })

    expect(exported).toEqual({ Значения: { ЗначениеA: {} } })
  })

  it("accepts enum values whose name is taken from the YAML key in JSON Schema", () => {
    const schema = Schema.Compile(exportMetadataEnumerationToJSONSchema({ context: mockContext }))

    expect(schema.Check({ Значения: { Значение1: {} } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Синоним: "Синоним" } } })).toBe(true)
    expect(schema.Check({ Значения: { Значение1: { Имя: "Значение1" } } })).toBe(true)
  })

  it("rejects invalid enum value properties in JSON Schema", () => {
    const schema = Schema.Compile(exportMetadataEnumerationToJSONSchema({ context: mockContext }))

    expect(schema.Check({ Значения: { Значение1: { Лишнее: "значение" } } })).toBe(false)
    expect(schema.Check({ Значения: { Значение1: { Имя: 1 } } })).toBe(false)
  })
})
