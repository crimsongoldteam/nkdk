import { Type } from "typebox"
import { describe, expect, it } from "vitest"
import "../../commonObjects/boolean/toJSONSchema"
import { EMPTY_XML_TAG_VALUE } from "../../../yaml/scalarTags"
import { mockContext } from "../../../tests/mockContext"
import { compileValidationSchema } from "../../validation/compileValidationSchema"
import { getValidationSchemaRef } from "../jsonSchemaRefs"
import { registerExplicitXMLProperty } from "./explicitXMLPropertyRegistry"
import { exportPropertiesToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "./types"

function probeRule(itemType: string): MetadataItemRule {
  return {
    itemType,
    properties: {
      flag: { type: "boolean", yaml: "Флаг", xml: "Flag", implicitValueYAML: true },
    },
  } as MetadataItemRule
}

describe("explicit XML property validation schema", () => {
  it("разрешает !xml только зарегистрированному ограниченному свойству", () => {
    const registeredRule = probeRule("ExplicitXMLSchemaProbe")
    registerExplicitXMLProperty({
      itemType: registeredRule.itemType,
      propertyKey: "flag",
      xmlValue: true,
      yamlValue: EMPTY_XML_TAG_VALUE,
    })
    const context = {
      ...mockContext,
      exportToJSONSchema: {
        mode: "inline" as const,
        refs: new Set<string>(),
        excludeImplicitValueYAML: true,
        validationPropertyRefs: true as const,
      },
    }
    const registeredSchema = Type.Object(
      exportPropertiesToJSONSchema({ context, rule: registeredRule })
    )
    const unregisteredSchema = Type.Object(
      exportPropertiesToJSONSchema({
        context,
        rule: probeRule("UnregisteredExplicitXMLSchemaProbe"),
      })
    )
    const refName = "nkdk://schema/validation/2.20/ru/boolean/without-true"
    const refSchema = getValidationSchemaRef(refName)
    if (refSchema === undefined) throw new Error("Expected boolean validation schema")
    const schemaContext = { [refName]: refSchema }

    expect(compileValidationSchema(schemaContext, registeredSchema).Check({ Флаг: "!xml" })).toBe(true)
    expect(compileValidationSchema(schemaContext, unregisteredSchema).Check({ Флаг: "!xml" })).toBe(false)
  })

  it("не показывает !xml во внешней схеме подсказок", () => {
    const rule = probeRule("ExplicitXMLExternalSchemaProbe")
    registerExplicitXMLProperty({
      itemType: rule.itemType,
      propertyKey: "flag",
      xmlValue: true,
      yamlValue: EMPTY_XML_TAG_VALUE,
    })
    const properties = exportPropertiesToJSONSchema({
      context: {
        ...mockContext,
        exportToJSONSchema: { mode: "externalRefs", refs: new Set<string>() },
      },
      rule,
    })

    expect(JSON.stringify(properties)).not.toContain('"const":"!xml"')
  })
})
