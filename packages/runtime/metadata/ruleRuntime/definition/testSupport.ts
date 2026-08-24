import type { MetadataItemRule } from "../property/types"
import type { MetadataRulesDefinition } from "./contracts"
import type { PropertyStateCapabilityContribution, PropertyStateMode } from "./contracts"

export const emptyMetadataRules: MetadataRulesDefinition<never, never, never> = {
  propertyTypes: {},
  propertyItemRules: {},
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
  xmlAnomalies: [],
}

export function metadataItemRule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} }
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
