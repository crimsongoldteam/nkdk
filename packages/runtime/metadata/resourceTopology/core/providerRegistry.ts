import type { CompiledMetadataResourceTopology, MetadataResourceItemRule } from "./types"
import { currentRuleRegistrySet } from "../../ruleRuntime/ruleRegistryExecutionContext"

export interface MetadataResourceTopologyProvider {
  revision(): string
  compile(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology
}

export function getMetadataResourceTopology(): CompiledMetadataResourceTopology {
  const contextual = currentRuleRegistrySet<{
    resourceTopology: { get(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology }
  }>()
  if (contextual === undefined) throw new Error("Не задан execution context resource topology")
  return contextual.resourceTopology.get()
}
