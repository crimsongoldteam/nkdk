import type { MetadataRulesDefinition } from "./contracts"
import { emptyMetadataRules } from "./testSupport"

export function composeMetadataRules(
  ...layers: readonly MetadataRulesDefinition[]
): MetadataRulesDefinition {
  return layers.reduce<MetadataRulesDefinition>(
    (result, layer) => ({
      propertyTypes: { ...result.propertyTypes, ...layer.propertyTypes },
      metadataItems: { ...result.metadataItems, ...layer.metadataItems },
      formElements: { ...result.formElements, ...layer.formElements },
      systemEnumerations: {
        ...result.systemEnumerations,
        ...layer.systemEnumerations,
      },
      schemas: { ...result.schemas, ...layer.schemas },
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
    emptyMetadataRules,
  )
}
