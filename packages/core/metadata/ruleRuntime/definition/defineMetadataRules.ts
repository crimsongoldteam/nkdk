import type { MetadataRulesDefinition } from "./contracts"

export function defineMetadataRules<const Definition extends MetadataRulesDefinition>(
  definition: Definition,
): Definition {
  return definition
}
