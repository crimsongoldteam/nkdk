import { capitalize } from "../../../helpers/capitalize"
import type { importExportFunction, PropertyRuleExecution } from "./fn"
import { getOrderedKeysToXML } from "./helpers"
import type { TypeRulesOperations } from "./ruleContracts"
import type { MetadataItemRule, PropertyRule } from "./types"
import {
  compileXMLImportPlanFromEntries,
  needsAbsentXMLImport,
  type XMLImportPlan,
  type XMLImportPlanEntry,
} from "./xmlImportPlan"
import type { CompiledAtomicConversion } from "./atomicConversion"
import { compileYamlPropertyOrder } from "./yamlPropertyOrder"
import { XMLImportViews } from "./xmlImportViews"

export const compiledPropertyOperationNames = [
  "importFromXML",
  "importFromXMLToYAML",
  "exportToXML",
  "importFromYAML",
  "exportToYAML",
  "metadataTargetOccurrences",
  "fileChildNamesDescriptor",
  "configurationIndexValueFromXML",
  "collectConfigurationIndexFromXML",
  "xmlImportPropertyBehavior",
  "nestedItemIdentity",
  "nestedItemRule",
  "resolveNestedImportXMLSources",
  "finalizeImportedYAML",
  "requiresImportedYAMLFinalization",
  "finalizeExportedXML",
  "yamlToXMLNestedRule",
  "prepareXMLItemOutput",
  "yamlScalarTagPolicy",
  "compileAtomicConversion",
] as const satisfies readonly TypeRulesOperations[]

type CompiledPropertyOperation = (typeof compiledPropertyOperationNames)[number]

export type CompiledPropertyOperations = {
  readonly [Operation in CompiledPropertyOperation]: importExportFunction<Operation>
}

export interface CompiledPropertyFlags {
  readonly requiresYAMLToXMLEvaluation: boolean
  readonly reserveNestedItemWhenAbsent: boolean
  readonly dependentImportProperty: boolean
  readonly runtimeOnly: boolean
  readonly syncExternalOnly: boolean
  readonly externalFile: boolean
  readonly repeatableXMLNodes: boolean
  readonly nestedItemsOwnXMLNode: boolean
  readonly atomicFromXMLToYAMLEligible: boolean
  readonly atomicFromYAMLToXMLEligible: boolean
}

export type MissingYAMLStrategy = "skip" | "default" | "evaluate"

export interface CompiledProperty extends XMLImportPlanEntry {
  readonly propertyRule: PropertyRule
  readonly yamlKey: string | undefined
  readonly xmlPath: readonly string[]
  readonly operations: CompiledPropertyOperations
  readonly flags: CompiledPropertyFlags
  readonly atomicConversion: CompiledAtomicConversion | undefined
  readonly missingYAMLStrategy: MissingYAMLStrategy
}

export interface CompiledPropertyPlan {
  readonly rule: MetadataItemRule
  readonly registryRevision: number
  readonly properties: readonly CompiledProperty[]
  readonly missingXMLProperties: readonly CompiledProperty[]
  readonly propertiesByKey: ReadonlyMap<string, CompiledProperty>
  readonly yamlToXMLOrder: readonly CompiledProperty[]
  emptyYAMLExportOrder(namePropertyKey?: string): readonly CompiledProperty[]
  selectedYAMLExportOrder(yaml: Readonly<Record<string, unknown>> | undefined, keys: Iterable<string>, namePropertyKey?: string): readonly CompiledProperty[]
  readonly yamlOrder: readonly string[]
  xmlImportView(params: {
    readonly tags?: readonly string[]
    readonly includeAllTags: boolean
  }): XMLImportPlan<CompiledProperty>
}

export interface CompiledPropertyRuleExecution extends PropertyRuleExecution {
  propertyPlan(rule: MetadataItemRule): CompiledPropertyPlan
}

export interface CompilePropertyPlanParams {
  readonly rule: MetadataItemRule
  readonly registryRevision: number
  readonly getTypeRule: <Operation extends TypeRulesOperations>(
    type: PropertyRule["type"],
    operation: Operation,
  ) => importExportFunction<Operation>
  readonly isDependentImportProperty: (itemType: string, propertyKey: string) => boolean
}

export function compilePropertyPlan(params: CompilePropertyPlanParams): CompiledPropertyPlan {
  const properties = Object.freeze(
    Object.entries(params.rule.properties).map(([propertyKey, rule]) =>
      compileProperty(params, propertyKey, rule),
    ),
  )
  const propertiesByKey = new Map(properties.map((property) => [property.propertyKey, property]))
  const missingXMLProperties = Object.freeze(properties.filter(({ propertyRule }) => needsAbsentXMLImport(propertyRule)))
  const yamlToXMLOrder = Object.freeze(
    getOrderedKeysToXML({ rule: params.rule })
      .map((propertyKey) => propertiesByKey.get(propertyKey))
      .filter((property): property is CompiledProperty => property !== undefined),
  )
  const xmlViews = new XMLImportViews(viewParams => compileXMLImportPlanFromEntries({
    rule: params.rule, entries: properties, missingXMLProperties, ...viewParams,
  }))
  const emptyYAMLOrders = new Map<string | undefined, readonly CompiledProperty[]>()
  const exportPositions = new Map(yamlToXMLOrder.map((property, index) => [property.propertyKey, index]))
  const yamlPositions = new Map<string, number[]>()
  for (const [index, property] of yamlToXMLOrder.entries()) {
    if (property.yamlKey === undefined) continue
    const positions = yamlPositions.get(property.yamlKey) ?? []
    positions.push(index)
    yamlPositions.set(property.yamlKey, positions)
  }

  const plan: CompiledPropertyPlan = {
    rule: params.rule,
    registryRevision: params.registryRevision,
    properties,
    missingXMLProperties,
    propertiesByKey,
    yamlToXMLOrder,
    emptyYAMLExportOrder(namePropertyKey) {
      const cached = emptyYAMLOrders.get(namePropertyKey)
      if (cached !== undefined) return cached
      const order = Object.freeze(yamlToXMLOrder.filter(property =>
        property.missingYAMLStrategy !== "skip"
        || property.propertyKey === namePropertyKey
        || property.propertyRule.externalFile !== undefined,
      ))
      emptyYAMLOrders.set(namePropertyKey, order)
      return order
    },
    selectedYAMLExportOrder(yaml, keys, namePropertyKey) {
      const absent = plan.emptyYAMLExportOrder(namePropertyKey)
      let selected: Uint32Array | undefined
      const include = (position: number) => {
        selected ??= new Uint32Array(Math.ceil(yamlToXMLOrder.length / 32))
        selected[position >>> 5] |= 1 << (position & 31)
      }
      for (const key of Object.keys(yaml ?? {})) {
        for (const position of yamlPositions.get(key) ?? []) include(position)
      }
      for (const key of keys) {
        const position = exportPositions.get(key)
        if (position !== undefined) include(position)
      }
      if (selected === undefined) return absent
      for (const property of absent) include(exportPositions.get(property.propertyKey)!)
      const result: CompiledProperty[] = []
      for (let word = 0; word < selected.length; word++) {
        let bits = selected[word]!
        while (bits !== 0) {
          const bit = 31 - Math.clz32(bits & -bits)
          result.push(yamlToXMLOrder[word * 32 + bit]!)
          bits &= bits - 1
        }
      }
      return result
    },
    yamlOrder: compileYamlPropertyOrder(properties.flatMap(property =>
      property.yamlKey === undefined ? [] : [property.yamlKey],
    )),
    xmlImportView(viewParams) {
      return xmlViews.get(viewParams)
    },
  }
  return Object.freeze(plan)
}

function compileProperty(
  params: CompilePropertyPlanParams,
  propertyKey: string,
  rule: PropertyRule,
): CompiledProperty {
  const operations = Object.fromEntries(
    compiledPropertyOperationNames.map((operation) => [
      operation,
      resolveOperation(params, propertyKey, rule, operation),
    ]),
  ) as CompiledPropertyOperations
  const canonicalXMLKey = rule.xml ?? capitalize(propertyKey)
  const nestedRule = operations.yamlToXMLNestedRule
  const xmlImportBehavior = operations.xmlImportPropertyBehavior
  const repeatableXMLNodes = nestedRule?.kind === "collection"
    || operations.fileChildNamesDescriptor !== undefined
    || xmlImportBehavior?.repeatedXMLNodes === true
  const nestedItemsOwnXMLNode = nestedRule?.kind === "item" && operations.nestedItemRule !== undefined
    || nestedRule?.kind === "collection" && (
    nestedRule.xmlElement === canonicalXMLKey
    || xmlImportBehavior?.nestedItemsOwnXMLChildren === true
  )
  const atomicConversion = operations.compileAtomicConversion?.({ rule })
  const atomicFromXMLToYAMLEligible = atomicConversion !== undefined
    && operations.importFromXMLToYAML === undefined
    && operations.resolveNestedImportXMLSources === undefined
  const atomicFromYAMLToXMLEligible = atomicConversion !== undefined
    && operations.yamlToXMLNestedRule === undefined
  const missingYAMLStrategy = compileMissingYAMLStrategy({
    rule,
    canonicalXMLKey,
    operations,
  })

  return Object.freeze({
    propertyKey,
    rule,
    propertyRule: rule,
    canonicalXMLKey,
    yamlKey: rule.yaml,
    xmlPath: Object.freeze([...(rule.xmlParents ?? []), canonicalXMLKey]),
    operations: Object.freeze(operations),
    atomicConversion: atomicConversion === undefined ? undefined : Object.freeze(atomicConversion),
    missingYAMLStrategy,
    flags: Object.freeze({
      requiresYAMLToXMLEvaluation:
        typeof rule.toXML === "function"
        || rule.evaluateWhenYAMLMissing === true
        || rule.exportNilValue === true
        || Object.prototype.hasOwnProperty.call(rule, "implicitValueXML"),
      reserveNestedItemWhenAbsent: operations.nestedItemIdentity?.reserveWhenAbsent === true,
      dependentImportProperty: params.isDependentImportProperty(params.rule.itemType, propertyKey),
      runtimeOnly: rule.runtimeOnly === true,
      syncExternalOnly: rule.syncExternalOnly === true,
      externalFile: rule.filePath !== undefined,
      repeatableXMLNodes,
      nestedItemsOwnXMLNode,
      atomicFromXMLToYAMLEligible,
      atomicFromYAMLToXMLEligible,
    }),
  })
}

function compileMissingYAMLStrategy(params: {
  readonly rule: PropertyRule
  readonly canonicalXMLKey: string
  readonly operations: CompiledPropertyOperations
}): MissingYAMLStrategy {
  const { rule, canonicalXMLKey, operations } = params
  const requiresEvaluation =
    typeof rule.toXML === "function"
    || rule.evaluateWhenYAMLMissing === true
    || rule.exportNilValue === true
    || Object.prototype.hasOwnProperty.call(rule, "implicitValueXML")
    || rule.excludeIfEqualNameYAML === true
    || canonicalXMLKey === "_id"
    || canonicalXMLKey === "_uuid"
    || operations.yamlToXMLNestedRule !== undefined
    || operations.nestedItemIdentity?.reserveWhenAbsent === true
    || operations.metadataTargetOccurrences !== undefined
    || operations.finalizeExportedXML !== undefined
    || operations.importFromYAML !== undefined
    || operations.exportToXML !== undefined

  if (requiresEvaluation) return "evaluate"
  if (
    Object.prototype.hasOwnProperty.call(rule, "defaultValueXML")
    || Object.prototype.hasOwnProperty.call(rule, "defaultValueAdoptedXML")
    || Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")
    || Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLEmpty")
  ) return "default"
  return "skip"
}

function resolveOperation<Operation extends CompiledPropertyOperation>(
  params: CompilePropertyPlanParams,
  propertyKey: string,
  rule: PropertyRule,
  operation: Operation,
): importExportFunction<Operation> {
  try {
    return params.getTypeRule(rule.type, operation)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new Error(
      `${params.rule.itemType}.${propertyKey} (${rule.type}), операция ${operation}: ${message}`,
      { cause },
    )
  }
}
