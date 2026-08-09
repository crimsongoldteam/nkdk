import "../../forms/elements/button/rules"
import "../../forms/elements/inputField/rules"
import "../../forms/elements/table/rules"
import "../../forms/elements/usualGroup/rules"
import { describe, expect, it } from "vitest"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "../../forms/commonObjects/childItems/treeYAML"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { structuralYamlValue } from "../../validation/structuralYamlValue"
import { parseMetadataYaml } from "../../../yaml/parseMetadataYaml"
import { getValidationSchemaRef } from "../jsonSchemaRefs"
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

  it("разрешает !xml для HeaderHorizontalAlign табличного поля только в validation", () => {
    const refs = new Set<string>()
    const schema = exportElementRuleToJSONSchema({
      context: {
        ...context,
        exportToJSONSchema: {
          mode: "inline",
          refs,
          excludeImplicitValueYAML: true,
          validationPropertyRefs: true,
        },
      },
      rule: getElementRule("TableInputField"),
      yamlKind: "ПолеВвода",
    })
    const schemaContext = Object.fromEntries([...refs].map((name) => {
      const registered = getValidationSchemaRef(name)
      if (registered === undefined) throw new Error(`Expected validation schema ${name}`)
      return [name, registered]
    }))
    const check = compileValidationSchema(schemaContext, schema)
    const marker = structuralYamlValue(parseMetadataYaml([
      "Вид: ПолеВвода",
      "ГоризонтальноеПоложениеВШапке: !xml",
    ].join("\n")).data)

    expect(check.Check(marker)).toBe(true)
    expect(check.Check({ Вид: "ПолеВвода", ГоризонтальноеПоложениеВШапке: "Авто" })).toBe(false)
    expect(check.Check({ Вид: "ПолеВвода", ГоризонтальноеПоложениеВШапке: "!xml Авто" })).toBe(false)

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
