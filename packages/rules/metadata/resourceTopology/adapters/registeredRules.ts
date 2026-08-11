import { typeRulesRegistryRevision } from "../../ruleRuntime/property/typeRuleRegistry"
import { getRegisteredProjectSpecs, projectSpecRegistryRevision } from "../../projectDefinition/projectSpecRegistry"
import type { CompiledMetadataResourceTopology } from "../core/types"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import {
  compileMetadataResourceTopologyForProjectSpecs,
  compileMetadataResourceTopologyForRootRule as compileRootRuleTopology,
} from "./ruleTopology"

export { getMetadataResourceTopology, registerMetadataResourceTopologyProvider } from "../core/providerRegistry"
export { describeProjectSpecResourceTopology, describePropertyResourceTopology } from "./ruleTopology"

let cachedTopology: { readonly revision: string; readonly topology: CompiledMetadataResourceTopology } | undefined

export function compileRegisteredMetadataResourceTopology(): CompiledMetadataResourceTopology {
  const contextual = currentRuleRegistrySet<{
    resourceTopology: { get(): CompiledMetadataResourceTopology }
  }>()
  if (contextual !== undefined) return contextual.resourceTopology.get()
  const revision = `${projectSpecRegistryRevision()}:${typeRulesRegistryRevision()}`
  if (cachedTopology?.revision === revision) return cachedTopology.topology
  const topology = compileMetadataResourceTopologyForProjectSpecs(getRegisteredProjectSpecs())
  cachedTopology = { revision, topology }
  return topology
}

export function compileMetadataResourceTopologyForRootRule(
  rootRule: Parameters<typeof compileRootRuleTopology>[0],
): CompiledMetadataResourceTopology {
  return compileRootRuleTopology(rootRule, getRegisteredProjectSpecs())
}
