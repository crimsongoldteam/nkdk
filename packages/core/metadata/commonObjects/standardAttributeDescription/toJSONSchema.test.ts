import { describe, expect, it } from "vitest"
import { mockContext } from "../../../tests/mockContext"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"
import { registerCoreMetadata } from "../../composition/coreMetadata"
import { getValidationSchemaRef } from "../../ruleRuntime/jsonSchemaRefs"
import type { StandardAttributeDescriptionsPropertyRule } from "../../ruleRuntime/property/types"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { exportStandardAttributeDescriptionToJSONSchema } from "./toJSONSchema"

registerCoreMetadata()

describe("StandardAttributeDescriptions JSON Schema", () => {
  it("скрывает fillValue forbidden-реквизита только из подсказок", () => {
    const rule = MetadataCatalogRules.properties.standardAttributes as StandardAttributeDescriptionsPropertyRule
    const validationContext = {
      ...mockContext,
      exportToJSONSchema: {
        mode: "inline" as const,
        refs: new Set<string>(),
        validationPropertyRefs: true as const,
      },
    }
    const validationSchema = exportStandardAttributeDescriptionToJSONSchema({
      context: validationContext,
      rule,
      value: undefined,
    })
    if (validationSchema === undefined) throw new Error("Expected validation schema")
    const refs = Object.fromEntries([...validationContext.exportToJSONSchema.refs].map((name) => {
      const schema = getValidationSchemaRef(name)
      if (schema === undefined) throw new Error(`Expected validation schema ${name}`)
      return [name, schema]
    }))
    const validation = compileValidationSchema(refs, validationSchema)

    const hintSchema = exportStandardAttributeDescriptionToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
      value: undefined,
    }) as {
      properties?: Record<string, { properties?: Record<string, unknown> }>
    }

    expect(validation.Check({ Предопределенный: { ЗначениеЗаполнения: "!xml Ложь" } })).toBe(true)
    expect(hintSchema.properties?.Предопределенный?.properties).not.toHaveProperty("ЗначениеЗаполнения")
    expect(hintSchema.properties?.ПометкаУдаления?.properties).toHaveProperty("ЗначениеЗаполнения")
    expect(JSON.stringify(hintSchema)).not.toContain("!xml")
  })
})
