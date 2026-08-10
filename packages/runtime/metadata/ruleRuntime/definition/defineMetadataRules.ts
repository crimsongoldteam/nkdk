import type {
  MetadataRulesDefinition,
  MetadataSynchronizationContribution,
} from "./contracts"

export function defineMetadataRules<
  const Synchronization extends readonly MetadataSynchronizationContribution[],
  const References extends readonly object[],
  const DataPaths extends readonly object[],
  const Definition extends Omit<MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>, "synchronization" | "references" | "dataPaths"> & {
    readonly synchronization: Synchronization
    readonly references: References
    readonly dataPaths: DataPaths
  },
>(
  definition: Definition,
): Definition {
  return definition
}
