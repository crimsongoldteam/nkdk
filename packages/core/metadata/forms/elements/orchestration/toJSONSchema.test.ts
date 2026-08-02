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
      required: expect.arrayContaining(["ТипКнопки"]),
    })

    const check = compileValidationSchema(schema)
    expect(check.Check({ Вид: "Кнопка" })).toBe(false)
    expect(check.Check({ Вид: "Кнопка", ТипКнопки: "ОбычнаяКнопка" })).toBe(true)
  })

  it("exposes child item type sets used by tree YAML", () => {
    expect(getChildItemTypesByPropertyType("GroupChildItems")).toContain("InputField")
    expect(getChildItemTypesByPropertyType("TableChildItems")).toContain("TableInputField")
    expect(getChildItemTypesByPropertyType("PagesChildItems")).toEqual(["Page"])
  })

  it("разрешает только явное Ложь для АвтоВводНовойСтроки", () => {
    const schema = exportElementRuleToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: "inline",
          refs: new Set<string>(),
          excludeImplicitValueYAML: true,
        },
      },
      rule: getElementRule("Table"),
      yamlKind: "ТаблицаФормы",
    })
    const check = compileValidationSchema(schema)

    expect(check.Check({ Вид: "ТаблицаФормы" })).toBe(true)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Ложь" })).toBe(true)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Истина" })).toBe(false)
    expect(check.Check({ Вид: "ТаблицаФормы", АвтоВводНовойСтроки: "Авто" })).toBe(false)
  })

  it.each(["РастягиватьПоГоризонтали", "РастягиватьПоВертикали"])(
    "разрешает оба boolean-значения для %s группы",
    (yamlKey) => {
      const schema = exportElementRuleToJSONSchema({
        context: {
          ...context,
          exportToJSONSchema: {
            mode: "inline",
            refs: new Set<string>(),
            excludeImplicitValueYAML: true,
          },
        },
        rule: getElementRule("UsualGroup"),
        yamlKind: "Группа",
      })
      const check = compileValidationSchema(schema)

      expect(check.Check({ Вид: "Группа" })).toBe(true)
      expect(check.Check({ Вид: "Группа", [yamlKey]: "Истина" })).toBe(true)
      expect(check.Check({ Вид: "Группа", [yamlKey]: "Ложь" })).toBe(true)
      expect(check.Check({ Вид: "Группа", [yamlKey]: "Авто" })).toBe(false)
    }
  )
})
