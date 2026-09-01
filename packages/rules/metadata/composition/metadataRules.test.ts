import { describe, expect, it } from "vitest"

import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"
import { metadataRules } from "./metadataRules"

describe("metadataRules", () => {
  it(
    "exports property rules without writing to the legacy registry",
    async () => {
      expect(metadataRules.propertyTypes.dateTime?.importFromXML).toBeTypeOf(
        "function",
      )
      expect(metadataRules.propertyTypes.dateTime?.exportToXML).toBeTypeOf(
        "function",
      )
      expect(
        metadataRules.propertyTypes.DcsLocalStringType?.exportToXML,
      ).toBeTypeOf("function")
      expect(
        metadataRules.propertyTypes.DcsLocalStringType?.yamlScalarTagPolicy,
      ).toEqual({ acceptedTags: ["xml/string"] })
      expect(metadataRules.propertyTypes.string?.yamlScalarTagPolicy).toBeUndefined()
      expect(metadataRules.propertyTypes.boolean?.compileAtomicConversion).toBeTypeOf("function")
      expect(metadataRules.propertyTypes.boolean?.importFromXML).toBeUndefined()
      expect(metadataRules.propertyTypes.boolean?.importFromYAML).toBeUndefined()
      expect(metadataRules.propertyTypes.boolean?.exportToYAML).toBeUndefined()
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
      expect(metadataRules.schemas.ClientApplicationForm).toBeDefined()
      expect(metadataRules.schemas.InputField).toBeDefined()
      expect(
        metadataRules.schemaPropertyRefs.GroupChildItems,
      ).toBeTypeOf("function")
      expect(Object.keys(metadataRules.schemas).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.formElements).length).toBeGreaterThan(0)
      expect(Object.keys(metadataRules.projectSpecs)).toHaveLength(48)
      expect(metadataRules.components).toHaveLength(2)
      expect(metadataRules.imports).toHaveLength(2)
      expect(metadataRules.synchronization.length).toBeGreaterThan(2)
      expect(metadataRules.validation).toHaveLength(15)
      expect(metadataRules.references.length).toBeGreaterThan(10)
      expect(metadataRules.dataPaths.length).toBeGreaterThan(20)
      expect(metadataRules.operations.length).toBeGreaterThan(2)
      expect(metadataRules.resourceTopology).toHaveLength(1)
      const assignments = createRuleRegistrySet(metadataRules).resourceTopology.get().assignments
      expect(assignments.length).toBeGreaterThan(0)
      const exchangePlan = assignments.find(
        (assignment) => assignment.projectPattern === "ПланОбмена/{ownerName}/Свойства.yaml",
      )
      expect(exchangePlan?.xmlDocuments).toContainEqual(expect.objectContaining({
        xmlPattern: "ExchangePlans/{ownerName}/Ext/Content.xml",
        role: "property",
        prepareCapabilityId: "itemProperty",
        source: expect.objectContaining({ propertyName: "content" }),
      }))
    },
    30_000,
  )
})
