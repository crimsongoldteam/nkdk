import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import type { MetadataResourceTopologyProvider } from "../core/providerRegistry"
import type { MetadataRulesDefinition, MetadataSynchronizationContribution } from "../../ruleRuntime/definition"
import { createPropertyRuleRegistrySet } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import {
  compileMetadataResourceTopologyForProjectSpecs,
  compileMetadataResourceTopologyForRootRule as compileMetadataResourceTopologyForRootRuleWithRegistry,
} from "./ruleTopology"

declare module "@nkdk/runtime/rule-kit" {
  interface MetadataResourceTopologyTypeMap {
    itemRule: MetadataItemRule
  }
}

export function createMetadataResourceTopologyProvider(
  definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>,
): MetadataResourceTopologyProvider {
  const propertyRules = createPropertyRuleRegistrySet(definition)
  const projectSpecs = Object.values(definition.projectSpecs)
  return {
    revision: () => "immutable",
    compile: (rootRule) =>
      rootRule === undefined
        ? compileMetadataResourceTopologyForProjectSpecs(projectSpecs, propertyRules)
        : compileRootRuleTopology(rootRule, projectSpecs, propertyRules),
  }
}

function compileRootRuleTopology(
  rootRule: MetadataItemRule,
  projectSpecs: Parameters<typeof compileMetadataResourceTopologyForProjectSpecs>[0],
  propertyRules: ReturnType<typeof createPropertyRuleRegistrySet>,
) {
  return compileMetadataResourceTopologyForRootRuleWithRegistry(
    rootRule,
    projectSpecs,
    propertyRules,
  )
}
