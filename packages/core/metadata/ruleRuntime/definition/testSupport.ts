import type { MetadataItemRule } from "../property/types"
import type { MetadataRulesDefinition } from "./contracts"

export const emptyMetadataRules: MetadataRulesDefinition = {
  propertyTypes: {},
  propertyItemRules: {},
  explicitXMLProperties: {},
  dependentItems: {},
  indexValuesFromYAML: {},
  metadataTargetOwners: {},
  metadataItems: {},
  formElements: {},
  systemEnumerations: {},
  schemas: {},
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
}

export function metadataItemRule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} }
}
