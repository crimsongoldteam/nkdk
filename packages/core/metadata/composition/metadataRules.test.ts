import { describe, expect, it } from "vitest"

import { typeRulesRegistryRevision } from "../ruleRuntime/property/typeRuleRegistry"
import { listJSONSchemaIdentityNames } from "../ruleRuntime/jsonSchemaRefs"
import { getElementRule } from "../ruleRuntime/formElement/ruleRegistry"

describe("metadataRules", () => {
  it(
    "exports property rules without writing to the legacy registry",
    async () => {
      const revisionBeforeImport = typeRulesRegistryRevision()
      const schemaNamesBeforeImport = listJSONSchemaIdentityNames()
      expect(() => getElementRule("InputField")).toThrow()

      const { metadataRules } = await import("./metadataRules")

      expect(typeRulesRegistryRevision()).toBe(revisionBeforeImport)
      expect(listJSONSchemaIdentityNames()).toEqual(schemaNamesBeforeImport)
      expect(() => getElementRule("InputField")).toThrow()
      expect(metadataRules.propertyTypes.dateTime?.importFromXML).toBeTypeOf(
        "function",
      )
      expect(metadataRules.propertyTypes.dateTime?.exportToXML).toBeTypeOf(
        "function",
      )
      expect(Object.keys(metadataRules.metadataItems).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.schemas).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.formElements).length).toBeGreaterThan(0)
    },
    30_000,
  )
})
