import "~/metadata/forms/elements/button/rules"
import "~/metadata/forms/elements/inputField/rules"
import "~/metadata/forms/elements/table/rules"
import { describe, expect, it } from "vitest"
import {
  getChildItemTypesByPropertyType,
  getTreeNodeJSONSchemaPropertyAliases,
} from "~/metadata/forms/commonObjects/childItems/treeYAML"
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
})
