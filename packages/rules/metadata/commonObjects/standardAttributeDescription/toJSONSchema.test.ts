import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"
import { exportMetadataItemToJSONSchema } from "../../ruleRuntime/metadataItem/toJSONSchema"


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

  it("разрешает !xml/absent только каноническому стандартному реквизиту без payload", () => {
    const schema = exportStandardAttributeDescriptionToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule: {
        type: "StandardAttributeDescriptions",
        standartAttributeNames: { ExchangeDate: "ДатаОбмена" },
      },
      value: undefined,
    })
    if (schema === undefined) throw new Error("Standard attributes schema is missing")
    const check = compileValidationSchema(schema)

    expect(check.Check({ ДатаОбмена: "!xml/absent" })).toBe(true)
    expect(check.Check({ ДатаОбмена: "!xml/absent payload" })).toBe(false)
    expect(check.Check({ Несуществующий: "!xml/absent" })).toBe(false)
  })

  it("не разрешает !xml/absent в обычной коллекции", () => {
    const schema = exportMetadataItemToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          validationPropertyRefs: true,
        },
      },
      rule: MetadataCatalogRules,
    })
    if (schema === undefined) throw new Error("Catalog schema is missing")
    const check = compileValidationSchema(schema)

    expect(check.Check({ Реквизиты: { Поле: "!xml/absent" } })).toBe(false)
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
