import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import type {
  CompiledMetadataResourceTopology,
  MetadataResourceItemRule,
} from "../resourceTopology/core/types"
import type {
  MetadataRulesDefinition,
  MetadataSchemaDefinition,
} from "./definition"
import type { ElementRule } from "./formElement/types"
import type { MetadataItemRule } from "./property/types"
import {
  createPropertyRuleRegistrySet,
  type PropertyRuleRegistrySet,
} from "./property/propertyRuleRegistrySet"

export interface RuleRegistrySet {
  readonly property: PropertyRuleRegistrySet
  readonly metadataItems: ReadonlyMap<string, MetadataItemRule>
  readonly formElements: ReadonlyMap<string, ElementRule>
  readonly schemas: {
    get(name: string): MetadataSchemaDefinition | undefined
  }
  readonly projectSpecs: ReadonlyMap<string, RegisteredProjectSpec>
  readonly resourceTopology: {
    get(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology
  }
}

export function createRuleRegistrySet(
  definition: MetadataRulesDefinition,
): RuleRegistrySet {
  const metadataItems = new Map(Object.entries(definition.metadataItems))
  const formElements = new Map(Object.entries(definition.formElements))
  const schemas = new Map(Object.entries(definition.schemas))
  const projectSpecs = new Map(Object.entries(definition.projectSpecs))
  const topologyProviders = [...definition.resourceTopology]
  const topologyCache = new Map<
    MetadataResourceItemRule | undefined,
    {
      readonly providerRevision: string
      readonly topology: CompiledMetadataResourceTopology
    }
  >()

  return {
    property: createPropertyRuleRegistrySet(definition),
    metadataItems,
    formElements,
    schemas: {
      get(name) {
        return schemas.get(name)
      },
    },
    projectSpecs,
    resourceTopology: {
      get(rootRule) {
        if (topologyProviders.length !== 1) {
          throw new Error(
            topologyProviders.length === 0
              ? "Metadata resource topology provider не задан"
              : "Задано несколько metadata resource topology providers",
          )
        }
        const provider = topologyProviders[0]
        if (provider === undefined) {
          throw new Error("Metadata resource topology provider не задан")
        }
        const providerRevision = provider.revision()
        const cached = topologyCache.get(rootRule)
        if (cached?.providerRevision === providerRevision) {
          return cached.topology
        }
        const topology = provider.compile(rootRule)
        topologyCache.set(rootRule, { providerRevision, topology })
        return topology
      },
    },
  }
}
