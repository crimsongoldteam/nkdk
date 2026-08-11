import type { CompiledMetadataResourceTopology } from "../core/types"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import {
  compileMetadataResourceTopologyForRootRule as compileRootRuleTopology,
} from "./ruleTopology"

export { getMetadataResourceTopology } from "../core/providerRegistry"
export { describeProjectSpecResourceTopology, describePropertyResourceTopology } from "./ruleTopology"

export function compileRegisteredMetadataResourceTopology(): CompiledMetadataResourceTopology {
  const contextual = currentRuleRegistrySet<{
    resourceTopology: { get(): CompiledMetadataResourceTopology }
  }>()
  if (contextual === undefined) throw new Error("Не задан execution context resource topology")
  return contextual.resourceTopology.get()
}

export function compileMetadataResourceTopologyForRootRule(
  rootRule: Parameters<typeof compileRootRuleTopology>[0],
): CompiledMetadataResourceTopology {
  const contextual = currentRuleRegistrySet<{
    resourceTopology: { get(rule: Parameters<typeof compileRootRuleTopology>[0]): CompiledMetadataResourceTopology }
  }>()
  if (contextual === undefined) throw new Error("Не задан execution context resource topology")
  return contextual.resourceTopology.get(rootRule)
}
