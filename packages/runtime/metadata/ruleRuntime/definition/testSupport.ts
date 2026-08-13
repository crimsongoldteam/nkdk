import type { MetadataItemRule } from "../property/types"
import type { MetadataRulesDefinition } from "./contracts"
import type { BrokenXMLReferenceCarrierRegistration } from "../property/brokenXMLReferenceCarrierRegistry"
import type { PropertyStateCapabilityContribution, PropertyStateMode } from "./contracts"

export const emptyMetadataRules: MetadataRulesDefinition<never, never, never> = {
  propertyTypes: {},
  propertyItemRules: {},
  explicitXMLProperties: {},
  explicitXMLPropertyTypes: {},
  brokenXMLReferenceCarriers: [],
  dependentItems: {},
  indexValuesFromYAML: {},
  metadataTargetOwners: {},
  metadataItems: {},
  formElements: {},
  formElementKinds: {},
  systemEnumerations: {},
  schemas: {},
  schemaPropertyRefs: {},
  projectSpecs: {},
  resourceTopology: [],
  validation: [],
  dataPaths: [],
  references: [],
  components: [],
  imports: [],
  synchronization: [],
  operations: [],
  workerOperations: [],
  propertyStateCapabilities: [],
}

export function metadataItemRule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} }
}

export function brokenXMLReferenceCarrier(
  name: string,
  propertyType: string,
  overrides: Partial<BrokenXMLReferenceCarrierRegistration> = {},
): BrokenXMLReferenceCarrierRegistration {
  return {
    name,
    propertyType,
    tryImport: () => undefined,
    prepareExport: () => undefined,
    patchExportedXML: ({ xmlValue }) => xmlValue,
    validationSchema: ({ base }) => base,
    matchesTaggedYAML: () => false,
    ...overrides,
  }
}

export function propertyStateCapability(
  id: string,
  modes: readonly PropertyStateMode[],
): PropertyStateCapabilityContribution {
  return {
    kind: "propertyStateCapability",
    id,
    item: {
      itemType: "Sample",
      profiles: [],
      properties: { value: { availability: "borrowed", modes } },
    },
  }
}
