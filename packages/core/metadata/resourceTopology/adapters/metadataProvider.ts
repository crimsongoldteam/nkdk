import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import { typeRulesRegistryRevision } from "../../ruleRuntime/property/typeRuleRegistry"
import { projectSpecRegistryRevision } from "../../project/projectSpecRegistry"
import {
  compileMetadataResourceTopologyForRootRule,
  compileRegisteredMetadataResourceTopology,
} from "./registeredRules"
import type { MetadataResourceTopologyProvider } from "../core/providerRegistry"

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
