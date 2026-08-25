import type { RegisteredProjectSpec } from "../projectDefinition/projectSpecContracts"
import type { MetadataComponentDescriptor } from "../components/descriptor"
import type {
  CompiledMetadataResourceTopology,
  MetadataResourceItemRule,
} from "../resourceTopology/core/types"
import type {
  MetadataRulesDefinition,
  MetadataSchemaDefinition,
  MetadataSchemaPropertyRefDefinition,
  MetadataSynchronizationContribution,
} from "./definition"
import type { ElementRule } from "./formElement/types"
import type { MetadataItemRule } from "./property/types"
import {
  createPropertyRuleRegistrySet,
  type PropertyRuleRegistrySet,
} from "./property/propertyRuleRegistrySet"
import {
  createPropertyRuleExecutor,
  type PropertyRuleExecutor,
} from "./property/propertyRuleExecutor"
import { createXmlAnomalyRegistry } from "./xmlAnomaly/registry"
import {
  createXmlAnomalyRuntime,
  type XmlAnomalyRuntime,
} from "./xmlAnomaly/runtime"

export interface RuleRegistrySet {
  readonly property: PropertyRuleRegistrySet
  readonly execution: PropertyRuleExecutor
  readonly xmlAnomalies: XmlAnomalyRuntime
  readonly metadataItems: ReadonlyMap<string, MetadataItemRule>
  readonly formElements: ReadonlyMap<string, ElementRule>
  readonly formElementKinds: ReadonlyMap<string, string>
  readonly schemas: {
    get(name: string): MetadataSchemaDefinition | undefined
    names(): Iterable<string>
    propertyRef(
      propertyType: string,
    ): MetadataSchemaPropertyRefDefinition | undefined
  }
  readonly projectSpecs: ReadonlyMap<string, RegisteredProjectSpec>
  readonly components: ReadonlyMap<string, MetadataComponentDescriptor>
  readonly resourceTopology: {
    get(rootRule?: MetadataResourceItemRule): CompiledMetadataResourceTopology
  }
}

export function createRuleRegistrySet(
  definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>,
): RuleRegistrySet {
  const metadataItems = new Map(Object.entries(definition.metadataItems))
  const formElements = new Map(Object.entries(definition.formElements))
  const formElementKinds = new Map(Object.entries(definition.formElementKinds))
  const schemas = new Map(Object.entries(definition.schemas))
  const schemaPropertyRefs = new Map(
    Object.entries(definition.schemaPropertyRefs),
  )
  const projectSpecs = new Map(Object.entries(definition.projectSpecs))
  const components = new Map(definition.components.map((component) => [component.kind, component]))
  const topologyProviders = [...definition.resourceTopology]
  const topologyCache = new Map<
    MetadataResourceItemRule | undefined,
    {
      readonly providerRevision: string
      readonly topology: CompiledMetadataResourceTopology
    }
  >()

  const property = createPropertyRuleRegistrySet(definition)
  const execution = createPropertyRuleExecutor(property)
  const xmlAnomalyRegistry = createXmlAnomalyRegistry(definition.xmlAnomalies)
  assertUnambiguousXmlAnomalyRegistrations({
    definition,
    resolve: xmlAnomalyRegistry.resolve,
    resolvePropertyItemRule: property.resolvePropertyItemRule,
  })
  return {
    property,
    execution,
    xmlAnomalies: createXmlAnomalyRuntime(xmlAnomalyRegistry),
    metadataItems,
    formElements,
    formElementKinds,
    schemas: {
      get(name) {
        return schemas.get(name)
      },
      names() {
        return schemas.keys()
      },
      propertyRef(propertyType) {
        return schemaPropertyRefs.get(propertyType)
      },
    },
    projectSpecs,
    components,
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

function assertUnambiguousXmlAnomalyRegistrations(params: {
  readonly definition: MetadataRulesDefinition<MetadataSynchronizationContribution, object, object>
  readonly resolve: ReturnType<typeof createXmlAnomalyRegistry>["resolve"]
  readonly resolvePropertyItemRule: PropertyRuleRegistrySet["resolvePropertyItemRule"]
}): void {
  const pending = [
    ...Object.values(params.definition.metadataItems),
    ...Object.values(params.definition.formElements),
    ...Object.values(params.definition.projectSpecs).map(({ rule }) => rule),
  ]
  const seen = new WeakSet<MetadataItemRule>()
  while (pending.length > 0) {
    const rule = pending.pop()
    if (rule === undefined || seen.has(rule)) continue
    seen.add(rule)
    for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
      params.resolve({
        itemType: rule.itemType,
        propertyKey,
        propertyType: propertyRule.type,
      })
      const nested = params.resolvePropertyItemRule(propertyRule)
      if (nested !== undefined) pending.push(nested)
    }
    for (const child of rule.childCollections ?? []) {
      pending.push(child.itemRule)
      if (child.fileItemRule !== undefined) pending.push(child.fileItemRule)
    }
  }
}
