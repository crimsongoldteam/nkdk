import "../../forms/elements/button/rules"
import "../../forms/elements/inputField/rules"
import "../../forms/elements/table/rules"
import "../../forms/elements/usualGroup/rules"
import { describe, expect, it } from "vitest"
import type { TSchema } from "typebox"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "../../forms/commonObjects/childItems/treeYAML"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { createValidationSchemaTestSession } from "../jsonSchemaTestSupport"
import { exportPropertyToJSONSchema } from "../property/toJSONSchema"
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

  it("renames the button type away from the Вид discriminator", () => {
    expect(getTreeNodeJSONSchemaPropertyAliases("Button")).toEqual({ Вид: "ТипКнопки" })
    expect(getTreeNodeJSONSchemaPropertyAliases("CommandBarButton")).toEqual({ Вид: "ТипКнопки" })
    expect(getTreeNodeJSONSchemaPropertyAliases("InputField")).toEqual({})
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

  it("разрешает !xml для HeaderHorizontalAlign табличного поля в validation", () => {
    const session = createValidationSchemaTestSession(context, "inline", {
      excludeImplicitValueYAML: true,
    })
    const schema = exportElementRuleToJSONSchema({
      context: session.context,
      rule: getElementRule("TableInputField"),
      yamlKind: "ПолеВвода",
    })
    const headerSchema = (schema as { properties?: Record<string, TSchema> }).properties?.[
      "ГоризонтальноеПоложениеВШапке"
    ]
    if (headerSchema === undefined) throw new Error("Expected HeaderHorizontalAlign schema")
    const propertyRefs = collectSchemaRefs(headerSchema)
    const schemaContext = Object.fromEntries([...propertyRefs].map((name) => {
      const registered = session.get(name)
      if (registered === undefined) throw new Error(`Expected validation schema ${name}`)
      return [name, registered]
    }))
    const check = compileValidationSchema(schemaContext, headerSchema)

    expect(check.Check("!xml")).toBe(true)
    expect(check.Check("Авто")).toBe(false)
    expect(check.Check("!xml Авто")).toBe(false)
  })

  it("не показывает !xml для HeaderHorizontalAlign в схеме подсказок", () => {
    const hint = exportElementRuleToJSONSchema({
      context,
      rule: getElementRule("TableInputField"),
      yamlKind: "ПолеВвода",
    })
    expect(JSON.stringify(hint)).not.toContain('"const":"!xml"')
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

function collectSchemaRefs(value: unknown, result = new Set<string>()): ReadonlySet<string> {
  if (Array.isArray(value)) {
    value.forEach((item) => collectSchemaRefs(item, result))
    return result
  }
  if (typeof value !== "object" || value === null) return result

  const record = value as Record<string, unknown>
  if (typeof record.$ref === "string") result.add(record.$ref)
  Object.values(record).forEach((item) => collectSchemaRefs(item, result))
  return result
}
