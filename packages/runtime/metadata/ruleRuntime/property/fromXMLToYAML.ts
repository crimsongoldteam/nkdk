import { performance } from "node:perf_hooks"
import {
  collectConfigurationIndexIdentityFromXML,
  collectConfigurationIndexImportedValue,
  collectConfigurationIndexPropertyFromXML,
} from "../../configurationIndex/collector/collectProperty"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexCollectionXmlNodeLogicalAddress,
  runWithConfigurationIndexPropertyContext,
} from "../../configurationIndex/collector/context"
import { configurationIndexPropertyXmlStateUid } from "../../configurationIndex/logicalAddress"
import type { ConfigurationContextFromXML } from "../../context/types"
import { buildExternalFileEntry } from "./externalFile"
import { getValueOrDefault, shouldProcessProperty } from "./helpers"
import type {
  DeferredRulePathSegment,
  DirectImportProfile,
  DirectImportTraversal,
  DirectImportXMLSource,
  ImportedDependentPropertyCollector,
} from "./importYamlTypes"
import {
  exportStringMetadataTargetToYAML,
  importStringMetadataTargetFromYAML,
  isTypeOwnedMetadataTargetUnavailable,
  metadataTargetOwnerForProperty,
  metadataTargetOwnerFromRule,
} from "./metadataTargetString"
import { importPropertyFromXML } from "./fromXML"
import {
  canExportPropertyToYAML,
  exportPropertyMetadataTargetsToYAML,
  exportPropertyValueBeforeMetadataTargetsToYAML,
  getExportToYAMLResult,
} from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { getXMLImportPlan, visitXMLImportPlan, type XMLImportPlanEntry } from "./xmlImportPlan"
import { sortYamlRuleProperties } from "./yamlPropertyOrder"
import { enterNestedYamlRule } from "./yamlRuleCursor"
import type { LocalIndexesCollector } from "../../projectDefinition/localIndexes"
import type { YamlPath } from "../../diagnostics/types"
import type { DeferredValuePathCollector } from "./importYamlTypes"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"
import { isDependentImportProperty } from "./dependentItemRegistry"
import type { PropertyRuleExecution } from "./fn"
import type { XmlElementNode } from "../../../xml/import/document"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditedNode,
  XmlImportAuditSession,
} from "../xmlAnomaly/importAudit"
import {
  createXmlImportAttemptJournal,
  XmlImportAttemptInfrastructureError,
} from "../xmlAnomaly/attempt"
import type { XmlAnomalyAnnotationTable } from "../../../yaml/xmlAnomalyAnnotations"
import { encodeXmlRawElement } from "../../../xml/structure/rawCodec"

export class DirectImportConversionError extends Error {
  constructor(
    readonly yamlPath: YamlPath,
    readonly rulePath: readonly DeferredRulePathSegment[],
    readonly xmlPath: readonly string[] | undefined,
    cause: unknown
  ) {
    const yaml = `/${yamlPath.map(String).join("/")}`
    const rule = `/${rulePath.map(({ propertyKey }) => propertyKey).join("/")}`
    const xml = xmlPath === undefined ? "" : `, xmlPath=/${xmlPath.join("/")}`
    super(`Ошибка XML → YAML: yamlPath=${yaml}, rulePath=${rule}${xml}: ${errorMessage(cause)}`, { cause })
    this.name = "DirectImportConversionError"
  }
}

export function importPropertiesFromXMLToYAML(params: {
  context: ConfigurationContextFromXML
  rule: MetadataItemRule
  sources: readonly DirectImportXMLSource[]
  itemName?: string
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  deferred?: DeferredValuePathCollector
  dependent?: ImportedDependentPropertyCollector
  profile?: DirectImportProfile
  propertyXML?: ReadonlyMap<string, unknown>
  propertyXMLNodes?: ReadonlyMap<string, readonly XmlElementNode[]>
  execution?: PropertyRuleExecution
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
}): Record<string, unknown> | undefined {
  const {
    context,
    rule,
    sources,
    itemName,
    yamlPath,
    rulePath,
    collector,
    deferred,
    propertyXML,
    propertyXMLNodes,
  } = params
  if (sources.length === 0) return undefined
  const typeRule = <Operation extends import("./fn").TypeRulesOperations>(
    type: import("./types").PropertyRule["type"],
    operation: Operation,
  ) => params.execution === undefined
    ? getTypeRule(type, operation)
    : params.execution.getTypeRule(type, operation)
  const selectedAmbiguousBoundaries = new Map<XmlElementNode, XmlImportAuditBoundary[]>()

  const result: Record<string, unknown> = {}
  const owner = metadataTargetOwnerFromRule({
    itemRule: rule,
    name: itemName,
    context,
    execution: params.execution,
  })
  const forReference = context.fromXML.forReference
  const importedExternalProperties = new Set<string>()
  const includeAllTags = sources.length === 1 && sources[0]?.tags === undefined
  const sourceStates = sources.map((source) => {
    const planningStartedAt = performance.now()
    const plan = getXMLImportPlan({ rule, tags: source.tags, includeAllTags })
    addProfileTime(params.profile, "planningMs", planningStartedAt)
    const indexCollection = getConfigurationIndexCollectionContext(source.context)
    const xmlNode = isXmlElementNode(source.xml) ? source.xml : undefined
    const xml = xmlNode === undefined
      ? source.xml as Record<string, unknown>
      : compatibilityRecord(xmlNode.compatibilityValue)
    return {
      source,
      xml,
      xmlNode,
      plan,
      indexCollection,
      xmlNodeLogicalAddress:
        indexCollection === undefined ? undefined : getConfigurationIndexCollectionXmlNodeLogicalAddress(indexCollection),
      ownerXmlName: getOwnerXmlName(xml),
      foundPropertyKeys: new Set<string>(),
    }
  })
  const planningStartedAt = performance.now()
  const sourceByProperty = sourceStates.length === 1 ? undefined : new Map<string, (typeof sourceStates)[number]>()
  if (sourceByProperty !== undefined) {
    for (const sourceState of sourceStates) {
      for (const propertyKey of sourceState.plan.entriesByPropertyKey.keys()) {
        if (sourceByProperty.has(propertyKey)) {
          throw new Error(`Для свойства ${propertyKey} найдено несколько XML-источников`)
        }
        sourceByProperty.set(propertyKey, sourceState)
      }
    }
  }
  addProfileTime(params.profile, "planningMs", planningStartedAt)

  const importMatch = (match: {
    sourceState: (typeof sourceStates)[number]
    entry: XMLImportPlanEntry
    sourceXMLKey: string | undefined
    xmlPath: readonly string[] | undefined
    sourceXMLValue: unknown
    xmlNode?: XmlImportAuditedNode
    xmlNodes?: readonly XmlElementNode[]
    presentInXML: boolean
    ambiguousXMLKey: boolean
  }): void => {
    if (params.profile !== undefined) params.profile.propertyCount++
    const {
      sourceState,
      entry,
      sourceXMLKey,
      xmlPath,
      sourceXMLValue,
      presentInXML,
      xmlNode,
      xmlNodes,
      ambiguousXMLKey,
    } = match
    const { propertyKey: key, rule: propertyRule } = entry
    const { source, indexCollection, ownerXmlName } = sourceState
    const { context: sourceContext } = source
    const propertyYamlPath = [...yamlPath, propertyRule.yaml ?? key]
    const propertyRulePath = [...rulePath, { propertyKey: key }]
    const boundary: XmlImportAuditBoundary = {
      itemType: rule.itemType,
      propertyKey: key,
      propertyType: propertyRule.type,
      yamlPath: propertyYamlPath,
      rulePath: propertyRulePath,
    }
    const attempt = createXmlImportAttemptJournal([
      indexCollection?.collector,
      collector,
      deferred,
      params.dependent,
    ]).begin()
    let discardAttempt = false
    try {
      const run = (): void => {
        const dependentImportProperty = params.execution === undefined
          ? isDependentImportProperty(rule.itemType, key)
          : params.execution.isDependentImportProperty(rule.itemType, key)
        const nestedRule = typeRule(propertyRule.type, "yamlToXMLNestedRule")
        const nestedConfigurationIndexAddressing =
          propertyRule.configurationIndexAddressing ??
          (nestedRule !== undefined && "configurationIndexAddressing" in nestedRule
            ? nestedRule.configurationIndexAddressing
            : undefined)
        const identityStartedAt = performance.now()
        collectConfigurationIndexIdentityFromXML({
          context: sourceContext,
          sourceXmlKey: sourceXMLKey,
          xmlValue: sourceXMLValue,
          descriptor: typeRule(propertyRule.type, "configurationIndexValueFromXML"),
        })
        addProfileTime(params.profile, "configurationIndexMs", identityStartedAt)

        const childCollection = rule.childCollections?.find((candidate) => candidate.propertyKey === key)
        const configurationIndexUidSegment =
          childCollection?.configurationIndexUidSegment ??
          propertyRule.configurationIndexUidSegment ??
          propertyRule.operationTarget?.migrationSegment

        const collectConfigurationIndex = typeRule(propertyRule.type, "collectConfigurationIndexFromXML")
        if (indexCollection !== undefined && sourceXMLKey !== undefined && collectConfigurationIndex !== undefined) {
          const indexStartedAt = performance.now()
          runWithConfigurationIndexPropertyContext(
            sourceContext,
            propertyRule.yaml ?? key,
            configurationIndexUidSegment,
            (propertyContext) =>
              collectConfigurationIndex({
                context: propertyContext,
                rule: propertyRule,
                xml: sourceXMLValue,
                propertyKey: key,
              }),
            { configurationIndexAddressing: propertyRule.configurationIndexAddressing, propertyKey: key }
          )
          addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
        }

        if (!forReference && propertyRule.forReferenceOnly === true) {
          collectConfigurationIndexPropertyFromXML({
            context: sourceContext,
            logicalAddress:
              indexCollection === undefined
                ? undefined
                : configurationIndexPropertyXmlStateUid(
                    indexCollection.logicalAddress,
                    key,
                    propertyRule.yaml,
                    indexCollection.yamlPathAddressing === true ||
                      propertyRule.configurationIndexAddressing === "yamlPath"
                  ),
            propertyKey: key,
            xmlValue: sourceXMLValue,
            presentInXML,
            rule: propertyRule,
            descriptor: typeRule(propertyRule.type, "configurationIndexValueFromXML"),
          })
          return
        }
        if (
          !presentInXML &&
          propertyRule.excludeIfEqualNameYAML === true &&
          (propertyRule.xmlParents?.length ?? 0) > 0
        ) return

        let xmlValue = sourceXMLValue
        if (!presentInXML && Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueXML")) {
          xmlValue = propertyRule.implicitValueXML
        }
        if (xmlValue === undefined && propertyRule.type === "MetadataDcsMetadataValue" && presentInXML) {
          xmlValue = null
        }
        if (xmlValue === undefined && propertyRule.type === "MetadataValue" && presentInXML) {
          xmlValue = { "_xsi:nil": true }
        }
        const propertyLogicalAddress =
          indexCollection === undefined
            ? undefined
            : configurationIndexPropertyXmlStateUid(
                indexCollection.logicalAddress,
                key,
                propertyRule.yaml,
                indexCollection.yamlPathAddressing === true || propertyRule.configurationIndexAddressing === "yamlPath"
              )
        if (sourceXMLKey !== undefined && !dependentImportProperty) {
          const indexStartedAt = performance.now()
          const nestedItemRule = typeRule(propertyRule.type, "nestedItemRule")
          collectConfigurationIndexPropertyFromXML({
            context: sourceContext,
            logicalAddress: propertyLogicalAddress,
            propertyKey: key,
            xmlValue,
            presentInXML:
              presentInXML && nestedItemXMLTypeMatches(
                nestedItemRule !== undefined && "itemRule" in nestedItemRule
                  ? nestedItemRule.itemRule.xsiType
                  : undefined,
                xmlValue,
              ),
            rule: propertyRule,
            descriptor: typeRule(propertyRule.type, "configurationIndexValueFromXML"),
          })
          addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
        }

        const shouldImportProperty = shouldProcessProperty({
          rule: propertyRule,
          operation: "importFromXML",
        })
        const shouldImportForReference = forReference && propertyRule.fromXML === false && presentInXML
        if (
          !shouldImportProperty &&
          !shouldImportForReference &&
          propertyXML?.has(key) !== true
        ) {
          if (
            presentInXML &&
            propertyRule.fromXML === false &&
            isXmlElementNode(xmlNode)
          ) {
            params.audit?.claimStructuralSubtree(xmlNode, boundary)
          }
          return
        }

        const hasExplicitXMLKeyWithEmptyDefault = "defaultValueXMLEmpty" in propertyRule && presentInXML
        const hasRawEmptyXML = hasExplicitXMLKeyWithEmptyDefault && (xmlValue === undefined || xmlValue === "")
        try {
          const direct = typeRule(propertyRule.type, "importFromXMLToYAML")
          const resolveNestedSources = typeRule(propertyRule.type, "resolveNestedImportXMLSources")
          const convertedDirectly = resolveNestedSources !== undefined || direct !== undefined
          const directTraversal: DirectImportTraversal<PropertyRuleExecution> = {
            yamlPath: propertyYamlPath,
            rulePath: propertyRulePath,
            collector,
            deferred,
            dependent: params.dependent,
            audit: params.audit,
            annotations: params.annotations,
            xmlNodes,
            profile: params.profile,
            execution: params.execution,
          }
          let importedValue: unknown
          if (resolveNestedSources !== undefined) {
            const nested = typeRule(propertyRule.type, "nestedItemRule")
            if (nested === undefined || !("itemRule" in nested)) {
              throw new Error(`Для ${propertyRule.type} не зарегистрировано фиксированное вложенное правило`)
            }
            const startedAt = performance.now()
            const nestedTraversal = enterNestedYamlRule(
              directTraversal,
              nested.itemRule.itemType
            )
            importedValue = runWithConfigurationIndexPropertyContext(
              sourceContext,
              propertyRule.yaml ?? key,
              configurationIndexUidSegment,
              (propertyContext) =>
                importPropertiesFromXMLToYAML({
                  context: propertyContext,
                  rule: nested.itemRule,
                  sources: resolveNestedSources({
                    context: propertyContext,
                    rule: propertyRule,
                    xml: xmlNode ?? xmlValue,
                    name: itemName,
                    ownerXmlName,
                    traversal: nestedTraversal,
                  }),
                  itemName,
                  yamlPath: nestedTraversal.yamlPath,
                  rulePath: nestedTraversal.rulePath,
                  collector,
                  deferred,
                  dependent: params.dependent,
                  audit: params.audit,
                  annotations: params.annotations,
                  profile: params.profile,
                  execution: params.execution,
                }),
              { configurationIndexAddressing: nestedConfigurationIndexAddressing }
            )
            addDirectImportProfile(params.profile, propertyRule.type, startedAt)
          } else if (direct === undefined) {
            const startedAt = performance.now()
            importedValue =
              hasRawEmptyXML && propertyRule.preserveEmptyXML === true
                ? propertyRule.defaultValueXMLEmpty
                : runWithConfigurationIndexPropertyContext(
                    sourceContext,
                    propertyRule.yaml ?? key,
                    configurationIndexUidSegment,
                    (propertyContext) =>
                      importPropertyFromXML({
                        context: propertyContext,
                        rule: propertyRule,
                        value: xmlValue,
                        name: key,
                        ownerXmlName,
                        execution: params.execution,
                      }),
                    { configurationIndexAddressing: nestedConfigurationIndexAddressing }
                  )
            const elapsedMs = performance.now() - startedAt
            const profile = params.profile
            if (profile !== undefined) {
              profile.legacyCount++
              profile.legacyFromXmlMs += elapsedMs
              addProfileBucket(profile.legacyByType, propertyRule.type, elapsedMs)
            }
          } else {
            const startedAt = performance.now()
            importedValue = runWithConfigurationIndexPropertyContext(
              sourceContext,
              propertyRule.yaml ?? key,
              configurationIndexUidSegment,
              (propertyContext) =>
                direct({
                  context: propertyContext,
                  rule: propertyRule,
                  xml: xmlValue,
                  name: itemName,
                  ownerXmlName,
                  traversal: directTraversal,
                }),
              { configurationIndexAddressing: nestedConfigurationIndexAddressing }
            )
            addDirectImportProfile(params.profile, propertyRule.type, startedAt)
          }
          claimCanonicalRawDefault({
            audit: params.audit,
            boundary,
            node: xmlNode,
            rule: propertyRule,
          })
          const registeredExplicitEmptyValue =
            importedValue === undefined && presentInXML && (xmlValue === undefined || xmlValue === "")
              ? typeRule(propertyRule.type, "xmlImportPropertyBehavior")?.explicitEmptyValue?.({
                  rule: propertyRule,
                })
              : undefined
          const clearedMetadataTarget =
            !forReference &&
            sourceContext.fromXML.propertyStateCompatibilityMode !== undefined &&
            isScalarMetadataTarget(propertyRule) &&
            importedValue === undefined &&
            presentInXML &&
            (xmlValue === undefined || xmlValue === "")
          const rawValue =
            clearedMetadataTarget
              ? null
              : importedValue === undefined && hasExplicitXMLKeyWithEmptyDefault && !convertedDirectly
              ? propertyRule.defaultValueXMLEmpty
              : importedValue === undefined
                ? registeredExplicitEmptyValue
                : importedValue
          const preserveExplicitDefault =
            propertyRule.preserveExplicitDefaultXML === true && presentInXML && rawValue === propertyRule.defaultValueXML
          const cleanValue =
            !convertedDirectly && !forReference && rawValue === propertyRule.defaultValueXML && !preserveExplicitDefault
              ? undefined
              : rawValue
          const defaultStartedAt = performance.now()
          const value = !forReference
            ? getValueOrDefault({
                context: sourceContext,
                rule: propertyRule,
                value: cleanValue,
                name: key,
                operation: "importFromXML",
              })
            : cleanValue
          addProfileTime(params.profile, "defaultMs", defaultStartedAt)

          if (value !== undefined && !dependentImportProperty) {
            const indexStartedAt = performance.now()
            collectConfigurationIndexImportedValue({
              context: sourceContext,
              logicalAddress: propertyLogicalAddress,
              propertyKey: key,
              importedValue: value,
            })
            addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
          }

          const exportStartedAt = performance.now()
          const propertyOwner = metadataTargetOwnerForProperty({
            rule: propertyRule,
            siblingValue: (propertyKey) => {
              const siblingYaml = rule.properties[propertyKey]?.yaml
              return siblingYaml === undefined ? undefined : result[siblingYaml]
            },
            owner,
          })
          const yamlValueBeforeMetadataTargets = clearedMetadataTarget
            ? null
            : !convertedDirectly
            ? exportPropertyValueBeforeMetadataTargetsToYAML({
                context: sourceContext,
                rule: propertyRule,
                value,
                name: itemName,
                owner: propertyOwner,
                execution: params.execution,
                preserveImplicitValue: preserveExplicitDefault,
              })
            : value
          const yamlValue = !convertedDirectly
            ? exportPropertyMetadataTargetsToYAML({
                context: sourceContext,
                rule: propertyRule,
                value,
                name: itemName,
                owner: propertyOwner,
                execution: params.execution,
                preserveImplicitValue: preserveExplicitDefault,
              }, yamlValueBeforeMetadataTargets)
            : yamlValueBeforeMetadataTargets
          const exportedYamlValue = yamlValue
          if (!convertedDirectly) {
            const profile = params.profile
            if (profile !== undefined) profile.yamlExportMs += performance.now() - exportStartedAt
          }
          if (propertyRule.externalFile && propertyRule.toYAML !== false) {
            const outputStartedAt = performance.now()
            const parentName = sourceContext.exportToYAML?.parent?.name
            const externalFiles = sourceContext.exportToYAML?.externalFilesCollector
            const externalValue = convertedDirectly ? yamlValue : value
            if (parentName !== undefined && externalFiles !== undefined && externalValue !== undefined) {
              const entry = buildExternalFileEntry(propertyRule.externalFile, parentName, externalValue as string)
              if (entry !== null) {
                externalFiles.push(entry)
                if (xmlNode !== undefined && "type" in xmlNode && xmlNode.type === "element") {
                  params.audit?.persistExternalSubtree(xmlNode, boundary)
                }
              }
            }
            importedExternalProperties.add(key)
            addProfileTime(params.profile, "outputMs", outputStartedAt)
            return
          }

          if (propertyRule.derivedFrom?.externalFile) {
            const outputStartedAt = performance.now()
            const referencedKey = propertyRule.derivedFrom.externalFile
            const derivedValue = convertedDirectly ? yamlValue : value
            if (
              derivedValue === true ||
              (derivedValue === propertyRule.implicitValueYAML && !importedExternalProperties.has(referencedKey))
            ) {
              addProfileTime(params.profile, "outputMs", outputStartedAt)
              return
            }
            addProfileTime(params.profile, "outputMs", outputStartedAt)
          }

          if (
            !canExportPropertyToYAML({ context: sourceContext, rule: propertyRule })
          ) return
          const outputStartedAt = performance.now()
          const exportedValues = getExportToYAMLResult(
            propertyRule,
            propertyRule.yaml!,
            exportedYamlValue,
            value,
            params.execution,
          )
          const emptyDirectValue = convertedDirectly && isEmptySemanticContainer(exportedYamlValue)
          const discardedAlternative = ambiguousXMLKey && emptyDirectValue
          if (exportedValues === undefined || discardedAlternative) {
            if (discardedAlternative) {
              params.annotations?.deleteSubtree(exportedYamlValue)
              discardAttempt = true
            }
            if (
              presentInXML &&
              emptyDirectValue &&
              isXmlElementNode(xmlNode) &&
              params.audit !== undefined
            ) {
              params.audit.elideSubtree(xmlNode, boundary)
            }
            return
          }
          if (
            ambiguousXMLKey
            && isXmlElementNode(xmlNode)
            && !isEmptySemanticContainer(exportedYamlValue)
          ) {
            const selected = selectedAmbiguousBoundaries.get(xmlNode)
            if (selected === undefined) selectedAmbiguousBoundaries.set(xmlNode, [boundary])
            else selected.push(boundary)
          }
          if (dependentImportProperty) {
            params.dependent?.accept({
              itemType: rule.itemType,
              ...(itemName === undefined ? {} : { itemName }),
              itemYamlPath: yamlPath,
              propertyKey: key,
              yamlPath: propertyYamlPath,
              ...(propertyLogicalAddress === undefined ? {} : { logicalAddress: propertyLogicalAddress }),
              xmlValue: sourceXMLValue,
              presentInXML,
            })
          }
          const profile = params.profile
          if (profile !== undefined) profile.exportedCount++
          addProfileTime(params.profile, "outputMs", outputStartedAt)
          const collectorStartedAt = performance.now()
          collector.acceptProperty({
            yamlPath: propertyYamlPath,
            rulePath: propertyRulePath,
            rule: propertyRule,
            value: exportedYamlValue,
            ...(owner === undefined ? {} : { metadataTargetOwner: owner }),
          })
          const finalize = typeRule(propertyRule.type, "finalizeImportedYAML")
          const requiresFinalization = typeRule(propertyRule.type, "requiresImportedYAMLFinalization")
          if (
            finalize !== undefined &&
            (requiresFinalization === undefined || requiresFinalization({ value: yamlValue }))
          ) {
            deferred?.accept({ valuePath: propertyYamlPath, rulePath: propertyRulePath })
          }
          Object.assign(result, exportedValues)
          copyYAMLRuntimeMetadata(exportedValues, result)
          addProfileTime(params.profile, "collectorMs", collectorStartedAt)
        } catch (cause) {
          if (cause instanceof XmlImportAttemptInfrastructureError) throw cause
          throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, xmlPath, cause)
        }
      }
      run()
    } catch (cause) {
      try {
        attempt.rollback()
      } catch (rollbackError) {
        throw aggregateAttemptFailure(cause, rollbackError)
      }
      if (
        cause instanceof DirectImportConversionError &&
        xmlNode !== undefined &&
        params.audit !== undefined
      ) {
        params.audit.rawCandidate(xmlNode, boundary, cause)
        return
      }
      throw cause
    }
    if (discardAttempt) {
      attempt.rollback()
      return
    }
    attempt.commit()
  }

  const importMissingEntry = (
    sourceState: (typeof sourceStates)[number],
    entry: XMLImportPlanEntry
  ): number => {
    sourceState.foundPropertyKeys.add(entry.propertyKey)
    const conversionStartedAt = performance.now()
    importMatch({
      sourceState,
      entry,
      sourceXMLKey: undefined,
      xmlPath: undefined,
      sourceXMLValue: undefined,
      xmlNode: undefined,
      xmlNodes: undefined,
      presentInXML: false,
      ambiguousXMLKey: false,
    })
    return performance.now() - conversionStartedAt
  }

  for (const sourceState of sourceStates) {
    const traversalStartedAt = performance.now()
    let conversionMs = 0
    visitXMLImportPlan({
      plan: sourceState.plan,
      xml: sourceState.xmlNode ?? sourceState.xml,
      audit: params.audit,
      auditItemBoundary: {
        itemType: rule.itemType,
        yamlPath,
        rulePath,
      },
      auditBoundary: ({ propertyKey, rule: propertyRule }) => ({
        itemType: rule.itemType,
        propertyKey,
        propertyType: propertyRule.type,
        yamlPath: [...yamlPath, propertyRule.yaml ?? propertyKey],
        rulePath: [...rulePath, { propertyKey }],
      }),
      isRepeatable: ({ rule: propertyRule }) =>
        typeRule(propertyRule.type, "yamlToXMLNestedRule")?.kind === "collection"
        || typeRule(propertyRule.type, "fileChildNamesDescriptor") !== undefined
        || typeRule(propertyRule.type, "xmlImportPropertyBehavior")?.repeatedXMLNodes === true,
      nestedItemsOwnNode: ({ canonicalXMLKey, rule: propertyRule }) => {
        const nestedRule = typeRule(propertyRule.type, "yamlToXMLNestedRule")
        return nestedRule?.kind === "collection" && (
          nestedRule.xmlElement === canonicalXMLKey
          || typeRule(propertyRule.type, "xmlImportPropertyBehavior")?.nestedItemsOwnXMLChildren === true
        )
      },
      claimRoot: sourceState.source.claimAuditRoot,
      visit(match) {
        sourceState.foundPropertyKeys.add(match.propertyKey)
        const conversionStartedAt = performance.now()
        importMatch({
          sourceState,
          entry: match,
          sourceXMLKey: match.sourceXMLKey,
          xmlPath: match.xmlPath,
          sourceXMLValue: match.xmlValue,
          xmlNode: match.xmlNode,
          xmlNodes: match.xmlNodes?.filter(
            (node): node is XmlElementNode => "type" in node && node.type === "element",
          ),
          presentInXML: true,
          ambiguousXMLKey: match.ambiguousXMLKey,
        })
        conversionMs += performance.now() - conversionStartedAt
      },
    })
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  for (const [node, selected] of selectedAmbiguousBoundaries) {
    const unique = uniqueAuditBoundaries(selected)
    if (unique.length === 1) params.audit?.selectPropertyBoundary(node, unique[0]!)
  }

  if (propertyXML !== undefined) {
    const traversalStartedAt = performance.now()
    let conversionMs = 0
    for (const [propertyKey, sourceXMLValue] of propertyXML) {
      const sourceState = sourceByProperty === undefined ? sourceStates[0] : sourceByProperty.get(propertyKey)
      const entry = sourceState?.plan.entriesByPropertyKey.get(propertyKey)
      if (sourceState === undefined || entry === undefined) continue
      const sourceNodes = typeRule(entry.rule.type, "resolveNestedImportXMLSources") === undefined
        ? undefined
        : propertyXMLNodes?.get(propertyKey)
      sourceState.foundPropertyKeys.add(propertyKey)
      const conversionStartedAt = performance.now()
      importMatch({
        sourceState,
        entry,
        sourceXMLKey: entry.canonicalXMLKey,
        xmlPath: [entry.canonicalXMLKey],
        sourceXMLValue,
        xmlNode: sourceNodes?.length === 1 ? sourceNodes[0] : undefined,
        xmlNodes: sourceNodes,
        presentInXML: true,
        ambiguousXMLKey: false,
      })
      conversionMs += performance.now() - conversionStartedAt
    }
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  for (const sourceState of sourceStates) {
    const traversalStartedAt = performance.now()
    let conversionMs = 0
    for (const entry of sourceState.plan.defaults) {
      if (sourceState.foundPropertyKeys.has(entry.propertyKey)) continue
      conversionMs += importMissingEntry(sourceState, entry)
    }
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  normalizeTypeOwnedMetadataTargets({ result, rule })
  return sortYamlRuleProperties(result)
}

function claimCanonicalRawDefault(params: {
  audit: XmlImportAuditSession | undefined
  boundary: XmlImportAuditBoundary
  node: XmlImportAuditedNode | undefined
  rule: PropertyRule
}): void {
  if (
    params.audit === undefined
    || !isXmlElementNode(params.node)
    || !Object.prototype.hasOwnProperty.call(params.rule, "defaultValueXMLRaw")
    || !sameCanonicalXmlValue(encodeXmlRawElement(params.node), params.rule.defaultValueXMLRaw)
  ) return
  claimAuditedSubtree(params.audit, params.node, params.boundary)
}

function claimAuditedSubtree(
  audit: XmlImportAuditSession,
  node: XmlImportAuditedNode,
  boundary: XmlImportAuditBoundary,
): void {
  audit.claim(node, boundary)
  if (!("type" in node) || node.type === "text") return
  for (const attribute of node.attributes) claimAuditedSubtree(audit, attribute, boundary)
  if (node.type === "processingInstruction") return
  for (const child of node.content) claimAuditedSubtree(audit, child, boundary)
}

function sameCanonicalXmlValue(actual: unknown, expected: unknown): boolean {
  if (
    (actual === "" && isEmptyPlainRecord(expected))
    || (expected === "" && isEmptyPlainRecord(actual))
  ) return true
  if (Array.isArray(actual) || Array.isArray(expected)) {
    return Array.isArray(actual)
      && Array.isArray(expected)
      && actual.length === expected.length
      && actual.every((value, index) => sameCanonicalXmlValue(value, expected[index]))
  }
  if (isPlainRecord(actual) || isPlainRecord(expected)) {
    if (!isPlainRecord(actual) || !isPlainRecord(expected)) return false
    const actualKeys = Object.keys(actual).sort()
    const expectedKeys = Object.keys(expected).sort()
    return actualKeys.length === expectedKeys.length
      && actualKeys.every((key, index) => key === expectedKeys[index])
      && actualKeys.every((key) => sameCanonicalXmlValue(actual[key], expected[key]))
  }
  if (
    typeof actual === "string"
    && (typeof expected === "boolean" || typeof expected === "number")
  ) return actual === String(expected)
  return Object.is(actual, expected)
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function isEmptyPlainRecord(value: unknown): boolean {
  return isPlainRecord(value) && Object.keys(value).length === 0
}

function normalizeTypeOwnedMetadataTargets(params: {
  result: Record<string, unknown>
  rule: MetadataItemRule
}): void {
  for (const propertyRule of Object.values(params.rule.properties)) {
    const constraint = propertyRule.metadataTarget
    if (constraint?.kind !== "member" || constraint.owner !== "type" || constraint.typeProperty === undefined) continue
    const yamlKey = propertyRule.yaml
    const typeYamlKey = params.rule.properties[constraint.typeProperty]?.yaml
    if (yamlKey === undefined || typeYamlKey === undefined || params.result[yamlKey] === undefined) continue
    if (isTypeOwnedMetadataTargetUnavailable({
      rule: propertyRule,
      siblingValue: () => params.result[typeYamlKey],
    })) {
      delete params.result[yamlKey]
      continue
    }
    const owner = metadataTargetOwnerForProperty({
      rule: propertyRule,
      siblingValue: () => params.result[typeYamlKey],
      owner: undefined,
    })
    if (owner === undefined) continue
    const canonical = importStringMetadataTargetFromYAML({ rule: propertyRule, value: params.result[yamlKey], owner })
    params.result[yamlKey] = exportStringMetadataTargetToYAML({ rule: propertyRule, value: canonical, owner })
  }
}

function isScalarMetadataTarget(rule: PropertyRule): boolean {
  return rule.metadataTarget !== undefined &&
    (rule.type === "string" || rule.type === "MetadataItemLink" || rule.type === "MetadataField")
}

function nestedItemXMLTypeMatches(expectedXsiType: string | undefined, xmlValue: unknown): boolean {
  if (expectedXsiType === undefined) return true
  if (xmlValue === null || typeof xmlValue !== "object" || Array.isArray(xmlValue)) return false
  const actualXsiType = (xmlValue as Record<string, unknown>)["_xsi:type"]
  return actualXsiType === expectedXsiType
}

function getOwnerXmlName(xml: Record<string, unknown>): string | undefined {
  return typeof xml._name === "string" ? xml._name : undefined
}

function compatibilityRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function isXmlElementNode(value: unknown): value is XmlElementNode {
  return value !== null &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "element" &&
    "compatibilityValue" in value
}

function isEmptySemanticContainer(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  if (value === null || typeof value !== "object") return false
  const prototype = Object.getPrototypeOf(value)
  return (prototype === Object.prototype || prototype === null) &&
    Object.values(value).every((nested) => nested === undefined)
}

function uniqueAuditBoundaries(
  boundaries: readonly XmlImportAuditBoundary[],
): XmlImportAuditBoundary[] {
  const unique = new Map<string, XmlImportAuditBoundary>()
  for (const boundary of boundaries) {
    unique.set(JSON.stringify([
      boundary.itemType,
      boundary.propertyKey,
      boundary.propertyType,
      boundary.yamlPath,
      boundary.rulePath,
    ]), boundary)
  }
  return [...unique.values()]
}

function addProfileTime(
  profile: DirectImportProfile | undefined,
  field: "planningMs" | "configurationIndexMs" | "defaultMs" | "outputMs" | "collectorMs",
  startedAt: number
): void {
  if (profile === undefined) return
  profile[field] += performance.now() - startedAt
}

function addProfileDuration(
  profile: DirectImportProfile | undefined,
  field: "xmlTraversalMs",
  durationMs: number
): void {
  if (profile === undefined) return
  profile[field] += Math.max(0, durationMs)
}

function addProfileBucket(
  buckets: Map<string, { count: number; timeMs: number }>,
  type: string,
  elapsedMs: number
): void {
  const current = buckets.get(type)
  if (current === undefined) {
    buckets.set(type, { count: 1, timeMs: elapsedMs })
    return
  }
  current.count++
  current.timeMs += elapsedMs
}

function addDirectImportProfile(
  profile: DirectImportProfile | undefined,
  propertyType: string,
  startedAt: number,
): void {
  if (profile === undefined) return
  const elapsedMs = performance.now() - startedAt
  profile.directCount++
  profile.directInclusiveMs += elapsedMs
  addProfileBucket(profile.directByType, propertyType, elapsedMs)
}

function aggregateAttemptFailure(cause: unknown, rollbackError: unknown): AggregateError {
  if (rollbackError instanceof XmlImportAttemptInfrastructureError) {
    return new XmlImportAttemptInfrastructureError(
      rollbackError.phase,
      rollbackError.cause,
      [cause, ...rollbackError.errors],
    )
  }
  const errors = rollbackError instanceof AggregateError
    ? [cause, ...rollbackError.errors]
    : [cause, rollbackError]
  return new AggregateError(
    errors,
    "Ошибка XML → YAML и отката XML-import attempt",
    { cause },
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
