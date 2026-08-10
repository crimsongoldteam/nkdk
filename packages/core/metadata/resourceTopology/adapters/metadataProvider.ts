import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { typeRulesRegistryRevision } from "../../ruleRuntime/property/typeRuleRegistry"
import { projectSpecRegistryRevision } from "../../projectDefinition/projectSpecRegistry"
import {
  compileMetadataResourceTopologyForRootRule,
  compileRegisteredMetadataResourceTopology,
} from "./registeredRules"
import type { MetadataResourceTopologyProvider } from "../core/providerRegistry"
import type { MetadataRulesDefinition, MetadataSynchronizationContribution } from "../../ruleRuntime/definition"
import { createPropertyRuleRegistrySet } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import {
  compileMetadataResourceTopologyForProjectSpecs,
  compileMetadataResourceTopologyForRootRule as compileMetadataResourceTopologyForRootRuleWithRegistry,
} from "./ruleTopology"

declare module "../core/types" {
  interface MetadataResourceTopologyTypeMap {
    itemRule: MetadataItemRule
  }
}

export const metadataResourceTopologyProvider: MetadataResourceTopologyProvider = {
  revision: () => `${projectSpecRegistryRevision()}:${typeRulesRegistryRevision()}`,
  compile: (rootRule) =>
    rootRule === undefined
      ? compileRegisteredMetadataResourceTopology()
      : compileMetadataResourceTopologyForRootRule(rootRule),
}

export function createMetadataResourceTopologyProvider(
  definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object>,
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
