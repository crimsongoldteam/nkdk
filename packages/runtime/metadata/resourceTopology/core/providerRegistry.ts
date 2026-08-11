import type { CompiledMetadataResourceTopology, MetadataResourceItemRule } from "./types"
import { currentRuleRegistrySet } from "../../ruleRuntime/ruleRegistryExecutionContext"

export interface MetadataResourceTopologyProvider {
  revision(): string
  compile(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology
}

let registeredProvider: MetadataResourceTopologyProvider | undefined
let cachedTopology:
  | {
      readonly provider: MetadataResourceTopologyProvider
      readonly revision: string
      readonly topology: CompiledMetadataResourceTopology
    }
  | undefined

export function registerMetadataResourceTopologyProvider(provider: MetadataResourceTopologyProvider): void {
  if (registeredProvider !== undefined && registeredProvider !== provider) {
    throw new Error("Metadata resource topology provider уже зарегистрирован")
  }
  registeredProvider = provider
  cachedTopology = undefined
}

export function getMetadataResourceTopology(): CompiledMetadataResourceTopology {
  const contextual = currentRuleRegistrySet<{
    resourceTopology: { get(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology }
  }>()
  if (contextual !== undefined) return contextual.resourceTopology.get()
  const provider = registeredProvider
  if (provider === undefined) throw new Error("Metadata resource topology provider не зарегистрирован")

  const revision = provider.revision()
  if (cachedTopology?.provider === provider && cachedTopology.revision === revision) return cachedTopology.topology

  const topology = provider.compile()
  cachedTopology = { provider, revision, topology }
  return topology
}

export function resetMetadataResourceTopologyProviderForTests(): void {
  registeredProvider = undefined
  cachedTopology = undefined
}
