import type {
  MetadataRulesDefinition,
  PropertyTypeDefinition,
} from "../definition"
import type { DependentItemRegistryLookup } from "./dependentItemRegistry"
import type {
  CollectionItemRule,
  importExportFunction,
  TypeRulesOperations,
} from "./fn"
import type { PropertyRuleType } from "./registry"
import type { RegisteredSystemEnumeration } from "./systemEnumerationRegistry"
import type { IndexValueFromYAMLFunction } from "./indexValueFromYAMLRegistry"
import type { MetadataTargetOwnerResolver } from "./metadataTargetOwnerRegistry"
import type { MetadataItemXmlImportAugmenter } from "../metadataItem/augmenterRegistry"
import type { MetadataItemXmlImportVariantParams } from "../metadataItem/augmenterRegistry"
import type { XMLImportObjectVariant } from "../../context/types"
import type { MetadataItemYamlToXmlAugmenter } from "./yamlToXmlAugmenter"
import type { MetadataImportedYamlFinalizer, MetadataImportedYamlFinalizerParams } from "../definition"
import type { MetadataItemRule } from "./types"

type ResolvedPropertyItemRule = CollectionItemRule["itemRule"]

interface PropertyWithItemRule {
  readonly type: PropertyRuleType
  readonly itemRule?: ResolvedPropertyItemRule
}

export type PropertyTypeRuleContribution = {
  readonly [Operation in TypeRulesOperations]: {
    readonly type: PropertyRuleType
    readonly operation: Operation
    readonly handler: NonNullable<importExportFunction<Operation>>
  }
}[TypeRulesOperations]

export function definePropertyTypeRule<Operation extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: Operation,
  handler: NonNullable<importExportFunction<Operation>>,
): Extract<PropertyTypeRuleContribution, { readonly operation: Operation }> {
  return { type, operation, handler } as Extract<
    PropertyTypeRuleContribution,
    { readonly operation: Operation }
  >
}

export function propertyTypesFromContributions(
  contributions: readonly PropertyTypeRuleContribution[],
): Readonly<Record<string, PropertyTypeDefinition>> {
  const definitions: Record<string, PropertyTypeDefinition> = {}
  for (const contribution of contributions) {
    const definition = { ...definitions[contribution.type] }
    setPropertyTypeOperation(definition, contribution)
    definitions[contribution.type] = definition
  }
  return definitions
}

function setPropertyTypeOperation(
  definition: PropertyTypeDefinition,
  contribution: PropertyTypeRuleContribution,
): void {
  const mutableDefinition = definition as Record<
    TypeRulesOperations,
    PropertyTypeDefinition[TypeRulesOperations]
  >
  mutableDefinition[contribution.operation] = contribution.handler
}

export interface PropertyRuleRegistrySet extends DependentItemRegistryLookup {
  registerTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
    handler: NonNullable<importExportFunction<Operation>>,
  ): void
  revision(): number
  registerMetadataItemXmlImportAugmenter(name: string, augmenter: MetadataItemXmlImportAugmenter): void
  resolveMetadataItemXMLDefaultVariant(
    params: MetadataItemXmlImportVariantParams,
  ): XMLImportObjectVariant | undefined
  applyMetadataItemXmlImportAugmenter(params: Parameters<MetadataItemXmlImportAugmenter["augment"]>[0]): void
  registerMetadataItemYamlToXmlAugmenter(componentKind: string, augmenter: MetadataItemYamlToXmlAugmenter): void
  augmentMetadataItemYamlToXml(params: Omit<Parameters<MetadataItemYamlToXmlAugmenter["augment"]>[0], "logicalAddress">): void
  registerImportedYamlFinalizer(itemType: string, finalizer: MetadataImportedYamlFinalizer): void
  requiresImportedYamlFinalization(yaml: unknown, rule: MetadataItemRule): boolean
  supportsImportedYamlFinalization(itemType: string): boolean
  finalizeImportedYaml(params: MetadataImportedYamlFinalizerParams): void
  getTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
  ): importExportFunction<Operation>
  resolvePropertyItemRule(
    rule: PropertyWithItemRule,
    fallback?: ResolvedPropertyItemRule,
  ): ResolvedPropertyItemRule | undefined
  getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined
  getSystemEnumerationNames(): readonly string[]
  getDeclaredPropertyItemRule<Rule extends object = object>(
    propertyType: string,
  ): Rule | undefined
  indexValueFromYAML<T>(propertyType: string, value: unknown): T | undefined
  getMetadataTargetOwnerResolver(
    itemType: string,
  ): MetadataTargetOwnerResolver | undefined
}

export function createPropertyRuleRegistrySet(
  definition: Pick<
    MetadataRulesDefinition,
    | "propertyTypes"
    | "propertyItemRules"
    | "metadataItems"
    | "projectSpecs"
    | "dependentItems"
    | "indexValuesFromYAML"
    | "metadataTargetOwners"
    | "systemEnumerations"
    | "operations"
  >,
): PropertyRuleRegistrySet {
  const typeRules = new Map(
    Object.entries(definition.propertyTypes).map(([type, operations]) => [
      type,
      { ...operations },
    ]),
  )
  let revision = 0
  const enumerations = new Map(Object.entries(definition.systemEnumerations))
  const propertyItemRules = collectPropertyItemRules(
    definition.propertyItemRules,
    [
      ...Object.values(definition.metadataItems),
      ...Object.values(definition.projectSpecs).map((spec) => spec.rule),
    ],
  )
  const indexValuesFromYAML = new Map<string, IndexValueFromYAMLFunction>(
    Object.entries(definition.indexValuesFromYAML),
  )
  const metadataTargetOwners = new Map<string, MetadataTargetOwnerResolver>(
    Object.entries(definition.metadataTargetOwners),
  )
  const dependentItems = new Map(Object.entries(definition.dependentItems))
  const xmlImportAugmenters = new Map<string, MetadataItemXmlImportAugmenter>()
  const yamlToXmlAugmenters = new Map<string, MetadataItemYamlToXmlAugmenter>()
  const importedYamlFinalizers = new Map<string, MetadataImportedYamlFinalizer>()
  for (const operation of definition.operations) {
    if (operation.kind === "xmlImportAugmenter") {
      xmlImportAugmenters.set(operation.name, operation.augmenter)
    } else if (operation.kind === "yamlToXmlAugmenter") {
      yamlToXmlAugmenters.set(operation.componentKind, operation.augmenter)
    } else if (operation.kind === "importedYamlFinalizer") {
      importedYamlFinalizers.set(operation.itemType, operation.finalizer)
    }
  }

  function getTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
  ): importExportFunction<Operation> {
    return typeRules.get(type)?.[operation] as importExportFunction<Operation>
  }

  return {
    registerTypeRule(type, operation, handler) {
      const definition = { ...typeRules.get(type) }
      ;(definition as Record<string, unknown>)[operation] = handler
      typeRules.set(type, definition)
      revision += 1
    },
    revision: () => revision,
    registerMetadataItemXmlImportAugmenter(name, augmenter) {
      if (xmlImportAugmenters.has(name)) {
        throw new Error(`Дополнение XML-import metadata-item уже зарегистрировано: ${name}`)
      }
      xmlImportAugmenters.set(name, augmenter)
    },
    resolveMetadataItemXMLDefaultVariant(params) {
      return selectedXmlImportAugmenter(xmlImportAugmenters, params.context)
        ?.resolveCurrentXMLDefaultVariant?.(params)
    },
    applyMetadataItemXmlImportAugmenter(params) {
      selectedXmlImportAugmenter(xmlImportAugmenters, params.context)?.augment(params)
    },
    registerMetadataItemYamlToXmlAugmenter(componentKind, augmenter) {
      if (yamlToXmlAugmenters.has(componentKind)) {
        throw new Error(`Дополнение YAML-to-XML metadata-item уже зарегистрировано: ${componentKind}`)
      }
      yamlToXmlAugmenters.set(componentKind, augmenter)
    },
    augmentMetadataItemYamlToXml(params) {
      const componentKind = params.context.exportToXML.componentKind
      const logicalAddress = params.context.exportToXML.configurationIndex?.logicalAddress
      if (componentKind === undefined || logicalAddress === undefined) return
      yamlToXmlAugmenters.get(componentKind)?.augment({ ...params, logicalAddress })
    },
    registerImportedYamlFinalizer(itemType, finalizer) {
      if (importedYamlFinalizers.has(itemType)) {
        throw new Error(`Уточнение импортированного YAML уже зарегистрировано: ${itemType}`)
      }
      importedYamlFinalizers.set(itemType, finalizer)
    },
    requiresImportedYamlFinalization(yaml, rule) {
      return importedYamlFinalizers.get(rule.itemType)?.requiresFinalization(yaml, rule) ?? false
    },
    supportsImportedYamlFinalization(itemType) {
      return importedYamlFinalizers.has(itemType)
    },
    finalizeImportedYaml(params) {
      importedYamlFinalizers.get(params.rule.itemType)?.finalize(params)
    },
    getTypeRule,
    resolvePropertyItemRule(rule, fallback) {
      return (
        rule.itemRule ??
        fallback ??
        getTypeRule(rule.type, "collectionItemRule")?.itemRule
      )
    },
    getSystemEnumeration(name) {
      return enumerations.get(name)
    },
    getSystemEnumerationNames() {
      return [...enumerations.keys()].sort()
    },
    getDeclaredPropertyItemRule<Rule extends object = object>(
      propertyType: string,
    ): Rule | undefined {
      return propertyItemRules.get(propertyType) as Rule | undefined
    },
    indexValueFromYAML<T>(propertyType: string, value: unknown): T | undefined {
      return indexValuesFromYAML.get(propertyType)?.(value) as T | undefined
    },
    getMetadataTargetOwnerResolver(itemType) {
      return metadataTargetOwners.get(itemType)
    },
    analyzeDependentYamlItem(params) {
      return (
        dependentItems.get(params.itemType)?.yaml?.(params) ?? {
          diagnostics: [],
          references: [],
          projectChecks: [],
        }
      )
    },
    collectDependentStructuralItemReferences(params) {
      return dependentItems.get(params.itemType)?.structural?.(params) ?? []
    },
    isDependentImportProperty(itemType, propertyKey) {
      return (
        dependentItems
          .get(itemType)
          ?.imported?.propertyKeys.includes(propertyKey) === true
      )
    },
    shouldRemoveImportedDependentProperty(params) {
      return (
        dependentItems.get(params.itemType)?.imported?.shouldRemove(params) ===
        true
      )
    },
    shouldTagImportedDependentProperty(params) {
      return (
        dependentItems.get(params.itemType)?.imported?.shouldTagXML?.(params) ===
        true
      )
    },
    shouldDeferImportedDependentProperty(params) {
      return (
        dependentItems.get(params.itemType)?.imported?.shouldDefer?.(params) ===
        true
      )
    },
  }
}

function selectedXmlImportAugmenter(
  augmenters: ReadonlyMap<string, MetadataItemXmlImportAugmenter>,
  context: MetadataItemXmlImportVariantParams["context"],
): MetadataItemXmlImportAugmenter | undefined {
  const fromXML = context.fromXML
  if (!("metadataItemAugmenter" in fromXML) || typeof fromXML.metadataItemAugmenter !== "string") return undefined
  const augmenter = augmenters.get(fromXML.metadataItemAugmenter)
  if (augmenter === undefined) {
    throw new Error(`Не зарегистрировано дополнение XML-import metadata-item: ${fromXML.metadataItemAugmenter}`)
  }
  return augmenter
}

export function collectPropertyItemRules(
  definitions: Readonly<Record<string, object>>,
  rootRules: readonly object[] = [],
): Map<string, object> {
  const result = new Map<string, object>()
  for (const [propertyType, itemRule] of Object.entries(definitions)) {
    result.set(propertyType, itemRule)
    collectNestedPropertyItemRules(result, itemRule)
  }
  for (const rootRule of rootRules) {
    collectNestedPropertyItemRules(result, rootRule)
  }
  return result
}

function collectNestedPropertyItemRules(
  result: Map<string, object>,
  itemRule: object,
): void {
  const properties = recordValue(recordValue(itemRule).properties)
  for (const property of Object.values(properties)) {
    const propertyRecord = recordValue(property)
    const propertyType = propertyRecord.type
    const nestedItemRule = recordValueOrUndefined(propertyRecord.itemRule)
    if (typeof propertyType !== "string" || nestedItemRule === undefined) continue
    result.set(propertyType, nestedItemRule)
    collectNestedPropertyItemRules(result, nestedItemRule)
  }
}

function recordValue(value: unknown): Readonly<Record<string, unknown>> {
  return recordValueOrUndefined(value) ?? {}
}

function recordValueOrUndefined(
  value: unknown,
): Readonly<Record<string, unknown>> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Readonly<Record<string, unknown>>)
    : undefined
}
