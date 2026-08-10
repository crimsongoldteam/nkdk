import type {
  MetadataRulesDefinition,
  MetadataSynchronizationContribution,
} from "./contracts"

export function defineMetadataRules<
  const Synchronization extends readonly MetadataSynchronizationContribution[],
  const Definition extends Omit<MetadataRulesDefinition, "synchronization"> & {
    readonly synchronization: Synchronization
  },
>(
  definition: Definition,
): Definition {
  return definition
}
