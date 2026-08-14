import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"


const standardAttributesRule = MetadataCatalogRules.properties.standardAttributes

describe("standard attribute description JSON Schema", () => {
  it("запрещает явный пустой синоним как значение по умолчанию", () => {
    const schema = exportStandardAttributeDescriptionToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          excludeImplicitValueYAML: true,
        },
      },
      rule: standardAttributesRule,
      value: undefined,
    })
    if (schema === undefined) throw new Error("Standard attributes schema is missing")
    const check = compileValidationSchema(schema)

    expect(check.Check({ Код: { Синоним: "" } })).toBe(false)
    expect(check.Check({ Код: { Синоним: "Код товара" } })).toBe(true)
    expect(check.Check({ Код: {} })).toBe(true)
  })

  it("включает зарегистрированный XML-scalar во внутреннюю схему", () => {
    const schema = exportStandardAttributeDescriptionToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule: standardAttributesRule,
      value: undefined,
    })
    if (schema === undefined) throw new Error("Standard attributes schema is missing")

    expect(JSON.stringify(schema)).toContain("^!xml/value[ \\\\t]+\\\\S.*$")
  })

  it("не предлагает запрещённое значение заполнения во внешней схеме", () => {
    const schema = exportStandardAttributeDescriptionToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule: standardAttributesRule,
      value: undefined,
    })
    if (schema === undefined) throw new Error("Standard attributes schema is missing")
    const properties = (schema as { properties?: Record<string, { properties?: Record<string, unknown> }> }).properties

    expect(properties?.Предопределенный?.properties).not.toHaveProperty("ЗначениеЗаполнения")
    expect(properties?.ПометкаУдаления?.properties).toHaveProperty("ЗначениеЗаполнения")
    expect(JSON.stringify(schema)).not.toContain("^!xml/value[ \\\\t]+\\\\S.*$")
  })
})
