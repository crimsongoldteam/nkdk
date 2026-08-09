import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { registerCoreMetadata } from "../../composition/coreMetadata"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"

registerCoreMetadata()

const standardAttributesRule = MetadataCatalogRules.properties.standardAttributes

describe("standard attribute description JSON Schema", () => {
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

    expect(JSON.stringify(schema)).toContain("^!xml(?: .*)?$")
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
    expect(JSON.stringify(schema)).not.toContain("!xml")
  })
})
