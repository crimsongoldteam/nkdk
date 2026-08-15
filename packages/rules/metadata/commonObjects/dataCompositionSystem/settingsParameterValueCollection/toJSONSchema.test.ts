import { describe, expect, it } from "vitest"
import { Type } from "typebox"

import { mockContext } from "../../../../tests/mockContext"
import { compileValidationSchema } from "../../../validation/compileValidationSchema"
import { createValidationSchemaTestSession } from "../../../ruleRuntime/jsonSchemaTestSupport"
import { exportPropertiesToJSONSchema } from "../../../ruleRuntime/property/toJSONSchema"
import { staticPropertyTypes } from "../../../composition/staticPropertyRules"
import { settingsParameterValueCollectionExplicitEmptyRules } from "./explicitEmpty"
import { exportSettingsParameterValueCollectionToJSONSchema } from "./toJSONSchema"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import {
  composeMetadataRules,
  createPropertyRuleExecutor,
  createPropertyRuleRegistrySet,
  defineMetadataRules,
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "@nkdk/runtime/rule-kit"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"

const ownerRule = {
  itemType: "SettingsParameterValueCollectionSchemaProbe",
  properties: {
    parameters: {
      type: "SettingsParameterValueCollection",
      yaml: "ПараметрыДанных",
      defaultItemRule: {
        type: "SettingsParameterValue",
        valueType: "Field",
      },
    },
  },
} as const satisfies MetadataItemRule

describe("SettingsParameterValueCollection JSON Schema", () => {
  it("различает !xml/present, пустой словарь и неверные теги", () => {
    const session = createValidationSchemaTestSession(mockContext, "inline")
    const execution = createPropertyRuleExecutor(createPropertyRuleRegistrySet(composeMetadataRules(
      defineMetadataRules({ ...emptyMetadataRules, propertyTypes: staticPropertyTypes }),
      defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: propertyTypesFromContributions([
          definePropertyTypeRule(
            "SettingsParameterValueCollection",
            "exportToJSONSchema",
            exportSettingsParameterValueCollectionToJSONSchema,
          ),
        ]),
      }),
      settingsParameterValueCollectionExplicitEmptyRules,
    )))
    const validation = compileValidationSchema(
      session.schemas(),
      Type.Object(exportPropertiesToJSONSchema({ context: session.context, rule: ownerRule, execution })),
    )

    expect(validation.Check({ ПараметрыДанных: "!xml/present" })).toBe(true)
    expect(validation.Check({ ПараметрыДанных: {} })).toBe(false)
    expect(validation.Check({ ПараметрыДанных: "!xml/present payload" })).toBe(false)
    expect(validation.Check({ ПараметрыДанных: "!xml/value" })).toBe(false)
  })
})
