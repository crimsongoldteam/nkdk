import "../button/rules"
import "../inputField/rules"
import "../table/rules"
import "../usualGroup/rules"
import { describe, expect, it } from "vitest"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "../../commonObjects/childItems/treeYAML"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { exportPropertyToJSONSchema } from "../../../orchestration/property/toJSONSchema"
import { getElementRule } from "./ruleFactory"
import { exportElementRuleToJSONSchema } from "./toJSONSchema"

const context = {
  defaultLanguage: "ru",
  version: "2.20",
} as const

describe("form element JSON Schema", () => {
  it("exports a tree node schema with Вид discriminator", () => {
    const schema = exportElementRuleToJSONSchema({
      context,
      rule: getElementRule("InputField"),
      yamlKind: "ПолеВвода",
    })

    expect(schema).toMatchObject({
      type: "object",
      additionalProperties: false,
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "ПолеВвода" }),
        ПутьКДанным: expect.any(Object),
      }),
      required: expect.arrayContaining(["Вид"]),
    })
  })

  it("renames button type schema away from the Вид discriminator", () => {
    const schema = exportElementRuleToJSONSchema({
      context,
      propertyAliases: getTreeNodeJSONSchemaPropertyAliases("Button"),
      rule: getElementRule("Button"),
      yamlKind: "Кнопка",
    })

    expect(schema).toMatchObject({
      type: "object",
      additionalProperties: false,
      properties: expect.objectContaining({
        Вид: expect.objectContaining({ const: "Кнопка" }),
        ТипКнопки: expect.any(Object),
      }),
    })
  })

  it("exposes child item type sets used by tree YAML", () => {
    expect(getChildItemTypesByPropertyType("GroupChildItems")).toContain("InputField")
    expect(getChildItemTypesByPropertyType("TableChildItems")).toContain("TableInputField")
    expect(getChildItemTypesByPropertyType("PagesChildItems")).toEqual(["Page"])
  })

  it("разрешает только явное Ложь для АвтоВводНовойСтроки", () => {
    const schema = exportPropertyToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          excludeImplicitValueYAML: true,
        },
      },
      rule: getElementRule("Table").properties.autoInsertNewRow,
      value: undefined,
    })
    if (schema === undefined) throw new Error("Expected АвтоВводНовойСтроки schema")
    const check = compileValidationSchema(schema)

    expect(check.Check("Ложь")).toBe(true)
    expect(check.Check("Истина")).toBe(false)
    expect(check.Check("Авто")).toBe(false)
  })

  it.each([
    ["РастягиватьПоГоризонтали", "horizontalStretch"],
    ["РастягиватьПоВертикали", "verticalStretch"],
  ] as const)(
    "разрешает оба boolean-значения для %s группы",
    (_yamlKey, propertyKey) => {
      const schema = exportPropertyToJSONSchema({
        context: {
          ...context,
          exportToJSONSchema: {
            mode: "inline",
            refs: new Set<string>(),
            excludeImplicitValueYAML: true,
          },
        },
        rule: getElementRule("UsualGroup").properties[propertyKey],
        value: undefined,
      })
      if (schema === undefined) throw new Error(`Expected ${propertyKey} schema`)
      const check = compileValidationSchema(schema)

      expect(check.Check("Истина")).toBe(true)
      expect(check.Check("Ложь")).toBe(true)
      expect(check.Check("Авто")).toBe(false)
    }
  )
})
