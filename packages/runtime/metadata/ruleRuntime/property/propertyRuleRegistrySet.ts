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
import type { PropertyRuleType } from "./registry"
import type { RegisteredSystemEnumeration } from "./systemEnumerationRegistry"
import type { IndexValueFromYAMLFunction } from "./indexValueFromYAMLRegistry"
import type { MetadataTargetOwnerResolver } from "./metadataTargetOwnerRegistry"

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

export interface PropertyRuleRegistrySet extends ExplicitXMLPropertyMatcher, DependentItemRegistryLookup {
  getTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
  ): importExportFunction<Operation>
  resolvePropertyItemRule(
    rule: PropertyWithItemRule,
    fallback?: ResolvedPropertyItemRule,
  ): ResolvedPropertyItemRule | undefined
  getSystemEnumeration(name: string): RegisteredSystemEnumeration | undefined
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
    | "explicitXMLProperties"
    | "explicitXMLPropertyTypes"
    | "dependentItems"
    | "indexValuesFromYAML"
    | "metadataTargetOwners"
    | "systemEnumerations"
  >,
): PropertyRuleRegistrySet {
  const typeRules = new Map(Object.entries(definition.propertyTypes))
  const enumerations = new Map(Object.entries(definition.systemEnumerations))
  const propertyItemRules = collectPropertyItemRules(definition.propertyItemRules)
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

  function getTypeRule<Operation extends TypeRulesOperations>(
    type: PropertyRuleType,
    operation: Operation,
  ): importExportFunction<Operation> {
    return typeRules.get(type)?.[operation] as importExportFunction<Operation>
  }

  return {
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
      if (registration?.action === "transportScalar") return undefined
      if (registration?.action === "omit") {
        return params.presentInXML ? undefined : registration
      }
      return registration !== undefined &&
        params.presentInXML &&
        Object.is(registration.xmlValue, params.xmlValue)
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

export function collectPropertyItemRules(
  definitions: Readonly<Record<string, object>>,
): Map<string, object> {
  const result = new Map<string, object>()
  for (const [propertyType, itemRule] of Object.entries(definitions)) {
    result.set(propertyType, itemRule)
    collectNestedPropertyItemRules(result, itemRule)
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
