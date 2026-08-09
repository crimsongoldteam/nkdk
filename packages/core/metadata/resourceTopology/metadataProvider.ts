import type { MetadataItemRule } from "../orchestration/property/types"
import { typeRulesRegistryRevision } from "../orchestration/property/typeRuleRegistry"
import { projectSpecRegistryRevision } from "../project/projectSpecRegistry"
import {
  compileMetadataResourceTopologyForRootRule,
  compileRegisteredMetadataResourceTopology,
} from "./registry"
import type { MetadataResourceTopologyProvider } from "./providerRegistry"

declare module "./types" {
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
