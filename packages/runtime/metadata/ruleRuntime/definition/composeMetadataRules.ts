import type {
  MetadataRulesDefinition,
  MetadataSynchronizationContribution,
  PropertyTypeDefinition,
} from "./contracts"
import { emptyMetadataRules } from "./testSupport"

export function composeMetadataRules<
  const Layers extends readonly (
    Omit<MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>, "synchronization"> & {
      readonly synchronization: readonly MetadataSynchronizationContribution[]
    }
  )[],
>(
  ...layers: Layers
): MetadataRulesDefinition<
  Layers[number]["synchronization"][number],
  Layers[number]["references"][number],
  Layers[number]["dataPaths"][number]
> {
  type SynchronizationContribution =
    Layers[number]["synchronization"][number]
  type ReferenceContribution = Layers[number]["references"][number]
  type DataPathContribution = Layers[number]["dataPaths"][number]
  return layers.reduce<MetadataRulesDefinition<SynchronizationContribution, ReferenceContribution, DataPathContribution>>(
    (result, layer) => ({
      propertyTypes: mergePropertyTypes(
        result.propertyTypes,
        layer.propertyTypes,
      ),
      propertyItemRules: {
        ...result.propertyItemRules,
        ...layer.propertyItemRules,
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
      formElementKinds: {
        ...result.formElementKinds,
        ...layer.formElementKinds,
      },
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
      propertyStateCapabilities: [
        ...result.propertyStateCapabilities,
        ...layer.propertyStateCapabilities,
      ],
      xmlAnomalies: [
        ...result.xmlAnomalies,
        ...layer.xmlAnomalies,
      ],
    }),
    emptyMetadataRules as MetadataRulesDefinition<SynchronizationContribution, ReferenceContribution, DataPathContribution>,
  )
}

function mergePropertyTypes(
  first: Readonly<Record<string, PropertyTypeDefinition>>,
  second: Readonly<Record<string, PropertyTypeDefinition>>,
): Readonly<Record<string, PropertyTypeDefinition>> {
  const result: Record<string, PropertyTypeDefinition> = { ...first }
  for (const [propertyType, operations] of Object.entries(second)) {
    result[propertyType] = {
      ...result[propertyType],
      ...operations,
    }
  }
  return result
}
