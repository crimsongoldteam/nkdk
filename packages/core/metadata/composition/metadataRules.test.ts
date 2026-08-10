import { describe, expect, it } from "vitest"

import { typeRulesRegistryRevision } from "../ruleRuntime/property/typeRuleRegistry"
import { listJSONSchemaIdentityNames } from "../ruleRuntime/jsonSchemaRefs"
import { getElementRule } from "../ruleRuntime/formElement/ruleRegistry"
import { projectSpecRegistryRevision } from "../projectDefinition/projectSpecRegistry"
import { findMetadataComponentDescriptor } from "../components/descriptor"
import { getRegisteredXmlImportComponentDescriptor } from "../importFromXml/componentDescriptor"

describe("metadataRules", () => {
  it(
    "exports property rules without writing to the legacy registry",
    async () => {
      const revisionBeforeImport = typeRulesRegistryRevision()
      const schemaNamesBeforeImport = listJSONSchemaIdentityNames()
      const projectRevisionBeforeImport = projectSpecRegistryRevision()
      expect(() => getElementRule("InputField")).toThrow()
      expect(findMetadataComponentDescriptor("configuration")).toBeUndefined()
      expect(() =>
        getRegisteredXmlImportComponentDescriptor("configuration"),
      ).toThrow()

      const { metadataRules } = await import("./metadataRules")

      expect(typeRulesRegistryRevision()).toBe(revisionBeforeImport)
      expect(listJSONSchemaIdentityNames()).toEqual(schemaNamesBeforeImport)
      expect(projectSpecRegistryRevision()).toBe(projectRevisionBeforeImport)
      expect(() => getElementRule("InputField")).toThrow()
      expect(findMetadataComponentDescriptor("configuration")).toBeUndefined()
      expect(() =>
        getRegisteredXmlImportComponentDescriptor("configuration"),
      ).toThrow()
      expect(metadataRules.propertyTypes.dateTime?.importFromXML).toBeTypeOf(
        "function",
      )
      expect(metadataRules.propertyTypes.dateTime?.exportToXML).toBeTypeOf(
        "function",
      )
      expect(Object.keys(metadataRules.metadataItems).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.schemas).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.formElements).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.projectSpecs).length).toBeGreaterThan(0)
      expect(metadataRules.components).toHaveLength(2)
      expect(metadataRules.imports).toHaveLength(2)
    },
    30_000,
  )
})
