import type { MetadataItemRule } from "../property/types"
import type { MetadataRulesDefinition } from "./contracts"

export const emptyMetadataRules: MetadataRulesDefinition<never, never, never> = {
  propertyTypes: {},
  propertyItemRules: {},
  explicitXMLProperties: {},
  explicitXMLPropertyTypes: {},
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
}

export function metadataItemRule(itemType: string): MetadataItemRule {
  return { itemType, properties: {} }
}
