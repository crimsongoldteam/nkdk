import type {
  MetadataRulesDefinition,
  MetadataSynchronizationContribution,
} from "./contracts"
import { emptyMetadataRules } from "./testSupport"

export function composeMetadataRules<
  const Layers extends readonly (
    Omit<MetadataRulesDefinition, "synchronization"> & {
      readonly synchronization: readonly MetadataSynchronizationContribution[]
    }
  )[],
>(
  ...layers: Layers
): MetadataRulesDefinition<Layers[number]["synchronization"][number]> {
  type SynchronizationContribution =
    Layers[number]["synchronization"][number]
  return layers.reduce<MetadataRulesDefinition<SynchronizationContribution>>(
    (result, layer) => ({
      propertyTypes: { ...result.propertyTypes, ...layer.propertyTypes },
      propertyItemRules: {
        ...result.propertyItemRules,
        ...layer.propertyItemRules,
      },
      explicitXMLProperties: {
        ...result.explicitXMLProperties,
        ...layer.explicitXMLProperties,
      },
      dependentItems: {
        ...result.dependentItems,
        ...layer.dependentItems,
      },
      indexValuesFromYAML: {
        ...result.indexValuesFromYAML,
        ...layer.indexValuesFromYAML,
      },
      metadataTargetOwners: {
        ...result.metadataTargetOwners,
        ...layer.metadataTargetOwners,
      },
      metadataItems: { ...result.metadataItems, ...layer.metadataItems },
      formElements: { ...result.formElements, ...layer.formElements },
      systemEnumerations: {
        ...result.systemEnumerations,
        ...layer.systemEnumerations,
      },
      schemas: { ...result.schemas, ...layer.schemas },
      schemaPropertyRefs: {
        ...result.schemaPropertyRefs,
        ...layer.schemaPropertyRefs,
      },
      projectSpecs: { ...result.projectSpecs, ...layer.projectSpecs },
      resourceTopology: [
        ...result.resourceTopology,
        ...layer.resourceTopology,
      ],
      validation: [...result.validation, ...layer.validation],
      dataPaths: [...result.dataPaths, ...layer.dataPaths],
      references: [...result.references, ...layer.references],
      components: [...result.components, ...layer.components],
      imports: [...result.imports, ...layer.imports],
      synchronization: [
        ...result.synchronization,
        ...layer.synchronization,
      ],
      operations: [...result.operations, ...layer.operations],
      workerOperations: [
        ...result.workerOperations,
        ...layer.workerOperations,
      ],
    }),
    emptyMetadataRules as MetadataRulesDefinition<SynchronizationContribution>,
  )
}
