import type {
  MetadataRulesDefinition,
  MetadataSynchronizationContribution,
} from "./contracts"

export function defineMetadataRules<
  const Synchronization extends readonly MetadataSynchronizationContribution[],
  const References extends readonly object[],
  const Definition extends Omit<MetadataRulesDefinition<MetadataSynchronizationContribution, object>, "synchronization" | "references"> & {
    readonly synchronization: Synchronization
    readonly references: References
  },
>(
  definition: Definition,
): Definition {
  return definition
}
