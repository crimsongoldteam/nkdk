import { describe, expect, it } from "vitest"

import { typeRulesRegistryRevision } from "../ruleRuntime/property/typeRuleRegistry"
import { listJSONSchemaIdentityNames } from "../ruleRuntime/jsonSchemaRefs"
import { getElementRule } from "../ruleRuntime/formElement/ruleRegistry"
import { projectSpecRegistryRevision } from "../projectDefinition/projectSpecRegistry"
import { findMetadataComponentDescriptor } from "../components/descriptor"
import { getRegisteredXmlImportComponentDescriptor } from "../importFromXml/componentDescriptor"
import { resolveFullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"
import { snapshotLocalYamlValueValidationRegistryForTests } from "../validation/yamlValueValidationRegistry"
import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"

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
      expect(() =>
        resolveFullXmlSyncComponentProfile({ kind: "configuration" }),
      ).toThrow()
      expect(
        snapshotLocalYamlValueValidationRegistryForTests().validators.has(
          "ClientApplicationForm",
        ),
      ).toBe(false)

      const { metadataRules } = await import("./metadataRules")

      expect(typeRulesRegistryRevision()).toBe(revisionBeforeImport)
      expect(listJSONSchemaIdentityNames()).toEqual(schemaNamesBeforeImport)
      expect(projectSpecRegistryRevision()).toBe(projectRevisionBeforeImport)
      expect(() => getElementRule("InputField")).toThrow()
      expect(findMetadataComponentDescriptor("configuration")).toBeUndefined()
      expect(() =>
        getRegisteredXmlImportComponentDescriptor("configuration"),
      ).toThrow()
      expect(() =>
        resolveFullXmlSyncComponentProfile({ kind: "configuration" }),
      ).toThrow()
      expect(
        snapshotLocalYamlValueValidationRegistryForTests().validators.has(
          "ClientApplicationForm",
        ),
      ).toBe(false)
      expect(metadataRules.propertyTypes.dateTime?.importFromXML).toBeTypeOf(
        "function",
      )
      expect(metadataRules.propertyTypes.dateTime?.exportToXML).toBeTypeOf(
        "function",
      )
      expect(
        metadataRules.propertyTypes.ChildFormNames?.resourceTopology,
      ).toBeTypeOf("function")
      expect(
        metadataRules.propertyTypes.ChildFormNames?.fileChildNamesDescriptor,
      ).toBeTypeOf("function")
      expect(
        metadataRules.propertyTypes.ChildFormNames?.syncExternalFromXML,
      ).toBeTypeOf("function")
      expect(Object.keys(metadataRules.metadataItems).length).toBeGreaterThan(0)
      expect(metadataRules.metadataItems.Order?.itemType).toBe("Order")
      expect(metadataRules.metadataItems.MetadataEnumeration?.itemType).toBe(
        "MetadataEnumeration",
      )
      expect(metadataRules.metadataItems.MetadataCommand?.itemType).toBe(
        "MetadataCommand",
      )
      expect(
        metadataRules.schemas.MetadataTaskAddressingAttribute,
      ).toBeDefined()
      expect(
        metadataRules.schemas.MetadataConfigurationExtension,
      ).toBeDefined()
      expect(Object.keys(metadataRules.schemas).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.formElements).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.projectSpecs)).toHaveLength(48)
      expect(metadataRules.components).toHaveLength(2)
      expect(metadataRules.imports).toHaveLength(2)
      expect(metadataRules.synchronization).toHaveLength(2)
      expect(metadataRules.validation).toHaveLength(1)
      expect(metadataRules.resourceTopology).toHaveLength(1)
      expect(
        createRuleRegistrySet(metadataRules).resourceTopology.get().assignments
          .length,
      ).toBeGreaterThan(0)
    },
    30_000,
  )
})
