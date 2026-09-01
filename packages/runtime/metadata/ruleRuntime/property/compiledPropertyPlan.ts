import { capitalize } from "../../../helpers/capitalize"
import type { importExportFunction } from "./fn"
import { getOrderedKeysToXML } from "./helpers"
import type { TypeRulesOperations } from "./ruleContracts"
import type { MetadataItemRule, PropertyRule } from "./types"
import {
  compileXMLImportPlanFromEntries,
  type XMLImportPlan,
  type XMLImportPlanEntry,
} from "./xmlImportPlan"

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
  "yamlScalarTagPolicy",
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
}

export interface CompiledProperty extends XMLImportPlanEntry {
  readonly yamlKey: string | undefined
  readonly xmlPath: readonly string[]
  readonly operations: CompiledPropertyOperations
  readonly flags: CompiledPropertyFlags
}

export interface CompiledPropertyPlan {
  readonly rule: MetadataItemRule
  readonly registryRevision: number
  readonly properties: readonly CompiledProperty[]
  readonly propertiesByKey: ReadonlyMap<string, CompiledProperty>
  readonly yamlToXMLOrder: readonly CompiledProperty[]
  xmlImportView(params: {
    readonly tags?: readonly string[]
    readonly includeAllTags: boolean
  }): XMLImportPlan<CompiledProperty>
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
  const yamlToXMLOrder = Object.freeze(
    getOrderedKeysToXML({ rule: params.rule })
      .map((propertyKey) => propertiesByKey.get(propertyKey))
      .filter((property): property is CompiledProperty => property !== undefined),
  )
  const xmlViews = new Map<string, XMLImportPlan<CompiledProperty>>()

  const plan: CompiledPropertyPlan = {
    rule: params.rule,
    registryRevision: params.registryRevision,
    properties,
    propertiesByKey,
    yamlToXMLOrder,
    xmlImportView(viewParams) {
      const key = viewParams.includeAllTags
        ? "*"
        : JSON.stringify([...(viewParams.tags ?? [])].sort())
      const cached = xmlViews.get(key)
      if (cached !== undefined) return cached
      const view = compileXMLImportPlanFromEntries({
        rule: params.rule,
        entries: properties,
        ...viewParams,
      })
      xmlViews.set(key, view)
      return view
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
  const nestedItemsOwnXMLNode = nestedRule?.kind === "collection" && (
    nestedRule.xmlElement === canonicalXMLKey
    || xmlImportBehavior?.nestedItemsOwnXMLChildren === true
  )

  return Object.freeze({
    propertyKey,
    rule,
    canonicalXMLKey,
    yamlKey: rule.yaml,
    xmlPath: Object.freeze([...(rule.xmlParents ?? []), canonicalXMLKey]),
    operations: Object.freeze(operations),
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
    }),
  })
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
