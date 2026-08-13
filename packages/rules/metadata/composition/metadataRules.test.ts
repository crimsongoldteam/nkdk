import { beforeAll, describe, expect, it } from "vitest"

import { createRuleRegistrySet } from "../ruleRuntime/ruleRegistrySet"

let metadataRules: (typeof import("./metadataRules"))["metadataRules"]

beforeAll(async () => {
  ({ metadataRules } = await import("./metadataRules"))
})

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
      expect(metadataRules.validation).toHaveLength(16)
      expect(metadataRules.references.length).toBeGreaterThan(10)
      expect(metadataRules.dataPaths.length).toBeGreaterThan(20)
      expect(metadataRules.operations.length).toBeGreaterThan(2)
      expect(metadataRules.resourceTopology).toHaveLength(1)
      expect(
        createRuleRegistrySet(metadataRules).resourceTopology.get().assignments
          .length,
      ).toBeGreaterThan(0)
    },
    30_000,
  )
})
