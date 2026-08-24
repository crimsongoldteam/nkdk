import { describe,expect,it } from "vitest"
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
})
