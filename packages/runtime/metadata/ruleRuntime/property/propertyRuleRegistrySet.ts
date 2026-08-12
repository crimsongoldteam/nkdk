import type {
  MetadataRulesDefinition,
  PropertyTypeDefinition,
} from "../definition"
import {
  collectExplicitXMLPropertyActions,
  explicitXMLPropertyValidationMode,
  type ExplicitXMLPropertyMatcher,
  registrationKey as propertyRegistrationKey,
  type ExplicitXMLPropertyAction,
  type ExplicitXMLPropertyRegistration,
  type ExplicitXMLPropertyTypeRegistration,
} from "./explicitXMLPropertyRegistry"
import type { DependentItemRegistryLookup } from "./dependentItemRegistry"
import type {
  CollectionItemRule,
  importExportFunction,
  TypeRulesOperations,
} from "./fn"
import { isDeepStrictEqual } from "node:util"
import type { PropertyRuleType } from "./registry"
import type { RegisteredSystemEnumeration } from "./systemEnumerationRegistry"
import type { IndexValueFromYAMLFunction } from "./indexValueFromYAMLRegistry"
import type { MetadataTargetOwnerResolver } from "./metadataTargetOwnerRegistry"
import type { MetadataItemXmlImportAugmenter } from "../metadataItem/augmenterRegistry"
import type { MetadataItemYamlToXmlAugmenter } from "./yamlToXmlAugmenter"
import type { MetadataImportedYamlFinalizer, MetadataImportedYamlFinalizerParams } from "../definition"
import type { MetadataItemRule } from "./types"
import {
  createBrokenXMLReferenceCarrierRegistry,
  type BrokenXMLReferenceCarrierRegistry,
} from "./brokenXMLReferenceCarrierRegistry"

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

export interface PropertyRuleRegistrySet extends ExplicitXMLPropertyMatcher, DependentItemRegistryLookup, BrokenXMLReferenceCarrierRegistry {
  registerTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
    handler: NonNullable<importExportFunction<Operation>>,
  ): void
  revision(): number
  registerExplicitXMLProperty(registration: ExplicitXMLPropertyRegistration): void
  registerExplicitXMLPropertyType(registration: ExplicitXMLPropertyTypeRegistration): void
  registerMetadataItemXmlImportAugmenter(name: string, augmenter: MetadataItemXmlImportAugmenter): void
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
  hasExplicitXMLProperty(itemType: string, propertyKey: string): boolean
  collectExplicitXMLPropertyActions(params: {
    readonly yaml: unknown
    readonly itemType: string
    readonly properties: Readonly<
      Record<string, { readonly type?: string; readonly yaml?: string }>
    >
  }): ReadonlyMap<string, ExplicitXMLPropertyAction>
  explicitXMLPropertyValidationMode(
    itemType: string,
    propertyKey: string,
    propertyType?: string,
  ): "empty" | "scalar" | undefined
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
    | "explicitXMLProperties"
    | "explicitXMLPropertyTypes"
    | "brokenXMLReferenceCarriers"
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
  const explicitXMLProperties = new Map<string, ExplicitXMLPropertyRegistration>()
  for (const registration of Object.values(definition.explicitXMLProperties)) {
    explicitXMLProperties.set(
      propertyRegistrationKey(registration.itemType, registration.propertyKey),
      registration,
    )
  }
  const explicitXMLPropertyTypes = new Map<string, ExplicitXMLPropertyTypeRegistration>()
  for (const registration of Object.values(definition.explicitXMLPropertyTypes)) {
    explicitXMLPropertyTypes.set(registration.propertyType, registration)
  }
  const indexValuesFromYAML = new Map<string, IndexValueFromYAMLFunction>(
    Object.entries(definition.indexValuesFromYAML),
  )
  const metadataTargetOwners = new Map<string, MetadataTargetOwnerResolver>(
    Object.entries(definition.metadataTargetOwners),
  )
  const dependentItems = new Map(Object.entries(definition.dependentItems))
  const brokenXMLReferenceCarriers = createBrokenXMLReferenceCarrierRegistry(
    definition.brokenXMLReferenceCarriers,
  )
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
    ...brokenXMLReferenceCarriers,
    registerTypeRule(type, operation, handler) {
      const definition = { ...typeRules.get(type) }
      ;(definition as Record<string, unknown>)[operation] = handler
      typeRules.set(type, definition)
      revision += 1
    },
    revision: () => revision,
    registerExplicitXMLProperty(registration) {
      const key = propertyRegistrationKey(registration.itemType, registration.propertyKey)
      const current = explicitXMLProperties.get(key)
      if (current !== undefined && !sameExplicitXMLPropertyRegistration(current, registration)) {
        throw new Error(`Конфликт регистрации явного XML-значения ${registration.itemType}.${registration.propertyKey}`)
      }
      explicitXMLProperties.set(key, registration)
    },
    registerExplicitXMLPropertyType(registration) {
      const current = explicitXMLPropertyTypes.get(registration.propertyType)
      if (
        current !== undefined &&
        !(current.action === registration.action && Object.is(current.yamlValue, registration.yamlValue))
      ) {
        throw new Error(`Конфликт регистрации явного XML-значения типа ${registration.propertyType}`)
      }
      explicitXMLPropertyTypes.set(registration.propertyType, registration)
    },
    registerMetadataItemXmlImportAugmenter(name, augmenter) {
      if (xmlImportAugmenters.has(name)) {
        throw new Error(`Дополнение XML-import metadata-item уже зарегистрировано: ${name}`)
      }
      xmlImportAugmenters.set(name, augmenter)
    },
    applyMetadataItemXmlImportAugmenter(params) {
      const fromXML = params.context.fromXML
      if (!("metadataItemAugmenter" in fromXML) || typeof fromXML.metadataItemAugmenter !== "string") return
      const augmenter = xmlImportAugmenters.get(fromXML.metadataItemAugmenter)
      if (augmenter === undefined) {
        throw new Error(`Не зарегистрировано дополнение XML-import metadata-item: ${fromXML.metadataItemAugmenter}`)
      }
      augmenter.augment(params)
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
    hasExplicitXMLProperty(itemType, propertyKey) {
      return explicitXMLProperties.has(
        propertyRegistrationKey(itemType, propertyKey),
      )
    },
    matchExplicitXMLPropertyFromXML(params) {
      const registration = explicitXMLProperties.get(
        propertyRegistrationKey(params.itemType, params.propertyKey),
      )
      if (registration?.action === "transportScalar" || registration?.action === "carrier") return undefined
      if (registration?.action === "omit") {
        return params.presentInXML ? undefined : registration
      }
      return registration !== undefined &&
        params.presentInXML &&
        isDeepStrictEqual(registration.xmlValue, params.xmlValue)
        ? registration
        : undefined
    },
    matchExplicitXMLPropertyTypeFromXML(params) {
      const registration = explicitXMLPropertyTypes.get(params.propertyType)
      return registration !== undefined &&
        params.presentInXML &&
        Object.is(params.yamlValue, registration.yamlValue)
        ? registration
        : undefined
    },
    collectExplicitXMLPropertyActions(params) {
      return collectExplicitXMLPropertyActions(params, {
        properties: explicitXMLProperties,
        propertyTypes: explicitXMLPropertyTypes,
      })
    },
    explicitXMLPropertyValidationMode(itemType, propertyKey, propertyType) {
      return explicitXMLPropertyValidationMode(itemType, propertyKey, propertyType, {
        properties: explicitXMLProperties,
        propertyTypes: explicitXMLPropertyTypes,
      })
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

function sameExplicitXMLPropertyRegistration(
  left: ExplicitXMLPropertyRegistration,
  right: ExplicitXMLPropertyRegistration,
): boolean {
  if (left.action === "carrier" || right.action === "carrier") {
    return left.action === "carrier" && right.action === "carrier" && left.prefix === right.prefix
  }
  if (left.action === "transportScalar" || right.action === "transportScalar") {
    return left.action === "transportScalar" &&
      right.action === "transportScalar" &&
      JSON.stringify(left.overrides) === JSON.stringify(right.overrides)
  }
  const leftAction = left.action ?? "emit"
  const rightAction = right.action ?? "emit"
  if (leftAction !== rightAction || !isDeepStrictEqual(left.yamlValue, right.yamlValue)) return false
  return leftAction === "omit" ||
    ("xmlValue" in left && "xmlValue" in right && isDeepStrictEqual(left.xmlValue, right.xmlValue))
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
