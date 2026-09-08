import { performance } from "node:perf_hooks"
import { collectConfigurationIndexIdentityFromXML } from "../../configurationIndex/collector/collectProperty"
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
  DirectImportPropertyFact,
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
  exportPropertyValueBeforeMetadataTargetsToYAML,
  getExportToYAMLResult,
  projectPropertyMetadataTargetsToYAML,
} from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { getXMLImportPlan, visitXMLImportPlan, type XMLImportPlanEntry } from "./xmlImportPlan"
import { getYamlRulePropertyOrder, orderYamlRuleProperties } from "./yamlPropertyOrder"
import { enterNestedYamlRule } from "./yamlRuleCursor"
import type { LocalIndexesCollector } from "../../projectDefinition/localIndexes"
import type { YamlPath } from "../../diagnostics/types"
import type { DeferredValuePathCollector } from "./importYamlTypes"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"
import { isDependentImportProperty } from "./dependentItemRegistry"
import type { PropertyRuleExecution } from "./fn"
import { isXmlElementNode, isEmptyXmlElement, isPlainXmlTextElement, xmlAttributeValue, type XmlElementNode } from "../../../xml/import/document"
import type {
  XmlImportAuditBoundary,
  XmlImportAuditedNode,
  XmlImportAuditSession,
} from "../xmlAnomaly/importAudit"
import {
  createXmlImportAttemptJournal,
  XmlImportAttemptInfrastructureError,
} from "../xmlAnomaly/attempt"
import {
  copyXmlAnomalyAnnotationsDeep,
  type XmlAnomalyAnnotationTable,
} from "../../../yaml/xmlAnomalyAnnotations"
import { encodeXmlRawElement } from "../../../xml/structure/rawCodec"
import { beginPropertyTypeProfile, finishPropertyTypeProfile } from "./propertyTypeProfile"
import type { CompiledProperty, CompiledPropertyRuleExecution } from "./compiledPropertyPlan"
import { canUseAtomicFromXMLToYAML } from "./atomicConversion"
import { assignMetadataTargetUuidAnnotations } from "./metadataTargetOccurrences"
import { markYAMLScalarTag, yamlValueTag } from "../../../yaml/scalarTags"
import { acceptNestedPropertyFactLeaves } from "./importFactLeaves"

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
  dependencies?: DirectImportTraversal["dependencies"]
  roundTrip?: DirectImportTraversal["roundTrip"]
  profile?: DirectImportProfile
  propertyXML?: ReadonlyMap<string, unknown>
  propertyXMLNodes?: ReadonlyMap<string, readonly XmlElementNode[]>
  execution?: CompiledPropertyRuleExecution
  beforeFinish?: (yaml: Record<string, unknown>) => void
  audit?: XmlImportAuditSession
  annotations?: XmlAnomalyAnnotationTable
  mode?: DirectImportTraversal["mode"]
  facts?: DirectImportTraversal["facts"]
  produceResult?: boolean
  initialYAML?: Record<string, unknown>
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

  const retainResult = params.mode !== "facts" || params.produceResult === true
  const result: Record<string, unknown> | undefined = retainResult ? params.initialYAML ?? {} : undefined
  const roundTrip = result === undefined || params.mode === "facts" || params.roundTrip === undefined
    || params.roundTrip.accepts?.(sources) === false
    ? undefined : runRoundTripStep("open", () => params.roundTrip?.open({
    context, rule, yaml: result, sources, itemName, yamlPath, rulePath, dependencies: params.dependencies,
  }))
  const retainedSiblingValues = new Map<string, unknown>()
  const retainedSiblingYamlKeys = metadataTargetSiblingYamlKeys(rule)
  const owner = metadataTargetOwnerFromRule({
    itemRule: rule,
    name: itemName,
    context,
    execution: params.execution,
  })
  const importedExternalProperties = new Set<string>()
  const includeAllTags = sources.length === 1 && sources[0]?.tags === undefined
  const compiledPlan = params.execution?.propertyPlan(rule)
  const sourceStates = sources.map((source) => {
    const planningStartedAt = performance.now()
    const plan = compiledPlan === undefined
      ? getXMLImportPlan({ rule, tags: source.tags, includeAllTags })
      : compiledPlan.xmlImportView({ tags: source.tags, includeAllTags })
    addProfileTime(params.profile, "planningMs", planningStartedAt)
    const indexCollection = getConfigurationIndexCollectionContext(source.context)
    const xmlNode = isXmlElementNode(source.xml) ? source.xml : undefined
    const xml = source.xml
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

  const importMatchUnprofiled = (match: {
    sourceState: (typeof sourceStates)[number]
    entry: XMLImportPlanEntry
    sourceXMLKey: string | undefined
    xmlPath: readonly string[] | undefined
    sourceXMLValue: unknown
    xmlNode?: XmlImportAuditedNode
    xmlOwnerNode?: XmlElementNode
    xmlNodes?: readonly XmlElementNode[]
    presentInXML: boolean
    ambiguousXMLKey: boolean
  }): { readonly proofReady: boolean; readonly structurallyClaimed: boolean; readonly semanticOmitted: boolean; readonly externalValue?: unknown } => {
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
    const compiled = "operations" in entry ? entry as CompiledProperty : undefined
    const { source, indexCollection, ownerXmlName } = sourceState
    const { context: sourceContext } = source
    const propertyYamlPath = propertyRule.yamlInline === true
      ? yamlPath
      : [...yamlPath, propertyRule.yaml ?? key]
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
      params.facts,
    ]).begin()
    let discardAttempt = false
    let proofReady = false
    let externalValue: unknown
    let structurallyClaimed = false
    const preparedPropertyDecision = params.dependencies?.propertyValue?.(yamlPath, key)
    let semanticOmitted = preparedPropertyDecision?.present === false
    try {
      const run = (): void => {
        const dependentImportProperty = compiled === undefined
          ? params.execution === undefined
          ? isDependentImportProperty(rule.itemType, key)
          : params.execution.isDependentImportProperty(rule.itemType, key)
          : compiled.flags.dependentImportProperty
        const nestedRule = compiled === undefined
          ? typeRule(propertyRule.type, "yamlToXMLNestedRule")
          : compiled.operations.yamlToXMLNestedRule
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
          descriptor: compiled === undefined
            ? typeRule(propertyRule.type, "configurationIndexValueFromXML")
            : compiled.operations.configurationIndexValueFromXML,
        })
        addProfileTime(params.profile, "configurationIndexMs", identityStartedAt)

        const childCollection = rule.childCollections?.find((candidate) => candidate.propertyKey === key)
        const configurationIndexUidSegment =
          childCollection?.configurationIndexUidSegment ??
          propertyRule.configurationIndexUidSegment ??
          propertyRule.operationTarget?.migrationSegment

        const collectConfigurationIndex = compiled === undefined
          ? typeRule(propertyRule.type, "collectConfigurationIndexFromXML")
          : compiled.operations.collectConfigurationIndexFromXML
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
        if (
          presentInXML
          && isXmlElementNode(xmlNode)
          && collectConfigurationIndex !== undefined
          && propertyRule.toYAML === false
          && propertyRule.toXML === false
        ) {
          structurallyClaimed = true
        }

        if (propertyRule.xmlOnly === true) {
          if (params.mode === "facts" && params.facts !== undefined) {
            acceptReconstructionPropertyFact({
              facts: params.facts, sourceContext, propertyRule, propertyKey: key,
              configurationIndexUidSegment, nestedConfigurationIndexAddressing,
              sourceXMLValue, ownerXmlName, execution: params.execution, compiled,
              itemRule: rule, yamlPath: propertyYamlPath, presentInXML,
            })
          }
          // Смысловой YAML это свойство не получает, но локальный proof выполняет
          // штатный экспорт с компактным значением первого прохода.
          structurallyClaimed = presentInXML
            && isXmlElementNode(xmlNode)
            && collectConfigurationIndex !== undefined
          proofReady = roundTrip !== undefined && presentInXML
          return
        }
        if (
          params.mode === "facts"
          && params.facts !== undefined
          && propertyRule.fromXML === false
          && propertyRule.toXML !== false
          && presentInXML
        ) {
          acceptReconstructionPropertyFact({
            facts: params.facts, sourceContext, propertyRule, propertyKey: key,
            configurationIndexUidSegment, nestedConfigurationIndexAddressing,
            sourceXMLValue, ownerXmlName, execution: params.execution, compiled,
            itemRule: rule, yamlPath: propertyYamlPath, presentInXML,
          })
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
        const shouldImportProperty = shouldProcessProperty({
          rule: propertyRule,
          operation: "importFromXML",
        })
        const shouldImportForLocalProof = roundTrip !== undefined
          && propertyRule.fromXML === false
          && propertyRule.toXML !== false
          && presentInXML
        if (
          !shouldImportProperty &&
          !shouldImportForLocalProof &&
          propertyXML?.has(key) !== true
        ) {
          if (
            presentInXML &&
            propertyRule.fromXML === false &&
            isXmlElementNode(xmlNode)
          ) {
            params.audit?.claimStructuralSubtree(xmlNode, boundary)
            structurallyClaimed = collectConfigurationIndex !== undefined
          }
          return
        }
        proofReady = true

        const hasExplicitXMLKeyWithEmptyDefault = "defaultValueXMLEmpty" in propertyRule && presentInXML
        const emptyXML = xmlValue === undefined || xmlValue === "" || isXmlElementNode(xmlValue) && isEmptyXmlElement(xmlValue)
        const hasRawEmptyXML = hasExplicitXMLKeyWithEmptyDefault && emptyXML
        let pendingScalarFact: DirectImportPropertyFact | undefined
        try {
          const direct = compiled === undefined
            ? typeRule(propertyRule.type, "importFromXMLToYAML")
            : compiled.operations.importFromXMLToYAML
          const resolveNestedSources = compiled === undefined
            ? typeRule(propertyRule.type, "resolveNestedImportXMLSources")
            : compiled.operations.resolveNestedImportXMLSources
          const convertedDirectly = resolveNestedSources !== undefined || direct !== undefined
          const explicitEmptyValue =
            presentInXML && emptyXML
              ? (compiled === undefined
                  ? typeRule(propertyRule.type, "xmlImportPropertyBehavior")
                  : compiled.operations.xmlImportPropertyBehavior)?.explicitEmptyValue?.({
                  rule: propertyRule,
                })
              : undefined
          const directTraversal: DirectImportTraversal<PropertyRuleExecution> = {
            ...(params.mode === undefined ? {} : { mode: params.mode }),
            ...(params.facts === undefined ? {} : { facts: params.facts }),
            ...(params.mode === "facts" ? { produceResult: true } : {}),
            yamlPath: propertyYamlPath,
            rulePath: propertyRulePath,
            collector,
            deferred,
            dependent: params.dependent,
            dependencies: params.dependencies,
            roundTrip: params.roundTrip,
            audit: params.audit,
            annotations: params.annotations,
            xmlNodes,
            profile: params.profile,
            execution: params.execution,
          }
          let importedValue: unknown
          let fusedRepresentationValue: unknown
          let usedFusedAtomic = false
          let fusedStartedAt: number | undefined
          const atomicConversion = compiled === undefined
            ? typeRule(propertyRule.type, "compileAtomicConversion")?.({ rule: propertyRule })
            : compiled.atomicConversion
          const atomicFromXMLToYAMLEligible = compiled === undefined
            ? atomicConversion !== undefined
              && direct === undefined
              && resolveNestedSources === undefined
            : compiled.flags.atomicFromXMLToYAMLEligible
          if (resolveNestedSources !== undefined) {
            const nested = compiled === undefined
              ? typeRule(propertyRule.type, "nestedItemRule")
              : compiled.operations.nestedItemRule
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
                  dependencies: params.dependencies,
                  roundTrip: params.roundTrip,
                  audit: params.audit,
                  annotations: params.annotations,
                  profile: params.profile,
                  execution: params.execution,
                  mode: params.mode,
                  facts: params.facts,
                  produceResult: params.mode !== "facts",
                }),
              { configurationIndexAddressing: nestedConfigurationIndexAddressing }
            )
            addDirectImportProfile(params.profile, propertyRule.type, startedAt)
          } else if (direct === undefined) {
            const atomicInvocation = atomicConversion === undefined
              ? undefined
              : {
                  conversion: atomicConversion,
                  staticallyEligible: atomicFromXMLToYAMLEligible,
                }
            if (atomicInvocation !== undefined && canUseAtomicFromXMLToYAML(atomicInvocation)) {
              fusedStartedAt = params.profile?.propertyTypeProfiling === true
                ? performance.now()
                : undefined
              const fused = runWithConfigurationIndexPropertyContext(
                sourceContext,
                propertyRule.yaml ?? key,
                configurationIndexUidSegment,
                (propertyContext) => atomicInvocation.conversion.fromXMLToYAML({
                  context: propertyContext,
                  value: hasRawEmptyXML && propertyRule.preserveEmptyXML === true
                    ? propertyRule.defaultValueXMLEmpty
                    : xmlValue,
                }),
                { configurationIndexAddressing: nestedConfigurationIndexAddressing },
              )
              importedValue = fused.metadataValue
              fusedRepresentationValue = fused.representationValue
              usedFusedAtomic = true
            } else {
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
                        compiled,
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
                  xml: xmlValue === undefined && explicitEmptyValue !== undefined ? "" : xmlValue,
                  name: itemName,
                  ownerXmlName,
                  traversal: directTraversal,
                }),
              { configurationIndexAddressing: nestedConfigurationIndexAddressing }
            )
            addDirectImportProfile(params.profile, propertyRule.type, startedAt)
          }
          if (
            params.mode === "facts"
            && convertedDirectly
            && propertyRule.filePath !== undefined
            && importedValue === undefined
          ) {
            collector.acceptProperty({
              yamlPath: propertyYamlPath,
              rulePath: propertyRulePath,
              rule: propertyRule,
              value: {},
              ...(owner === undefined ? {} : { metadataTargetOwner: owner }),
            })
          }
          const claimedCanonicalRawDefault = claimCanonicalRawDefault({
            audit: params.audit,
            boundary,
            node: xmlNode,
            rule: propertyRule,
          })
          const registeredExplicitEmptyValue =
            !convertedDirectly &&
            importedValue === undefined &&
            explicitEmptyValue !== undefined
              ? explicitEmptyValue
              : undefined
          const registeredPresentEmptyItem =
            importedValue === undefined &&
            presentInXML &&
            propertyRule.itemRule !== undefined &&
              (compiled === undefined
                ? typeRule(propertyRule.type, "xmlImportPropertyBehavior")
                : compiled.operations.xmlImportPropertyBehavior)?.presenceAffectsExport === true
              ? {}
              : undefined
          const clearedMetadataTarget =
            sourceContext.fromXML.propertyStateCompatibilityMode !== undefined &&
            isScalarMetadataTarget(propertyRule) &&
            importedValue === undefined &&
            presentInXML &&
            emptyXML
          const rawValue =
            clearedMetadataTarget
              ? null
              : importedValue === undefined && hasExplicitXMLKeyWithEmptyDefault && !convertedDirectly
              ? propertyRule.defaultValueXMLEmpty
              : importedValue === undefined
                ? registeredExplicitEmptyValue ?? registeredPresentEmptyItem
                : importedValue
          const preserveExplicitDefault =
            propertyRule.preserveExplicitDefaultXML === true && presentInXML && rawValue === propertyRule.defaultValueXML
          const cleanValue =
            !convertedDirectly && rawValue === propertyRule.defaultValueXML && !preserveExplicitDefault
              ? undefined
              : rawValue
          const defaultStartedAt = performance.now()
          const restoresExplicitEmptyInlineCollection =
            convertedDirectly &&
            cleanValue === undefined &&
            propertyRule.yamlInline === true &&
            Array.isArray(propertyRule.defaultValue) &&
            propertyRule.defaultValue.length === 0 &&
            Array.isArray(propertyRule.defaultValueXMLEmpty)
          const value = convertedDirectly && !restoresExplicitEmptyInlineCollection
            ? cleanValue
            : getValueOrDefault({
                context: sourceContext,
                rule: propertyRule,
                value: cleanValue,
                name: key,
                operation: "importFromXML",
              })
          const omitsImplicitFusedValue =
            usedFusedAtomic
            && preserveExplicitDefault !== true
            && Object.prototype.hasOwnProperty.call(propertyRule, "implicitValueYAML")
            && value === propertyRule.implicitValueYAML
          if (omitsImplicitFusedValue) {
            fusedRepresentationValue = undefined
          } else if (
            usedFusedAtomic
            && value !== importedValue
            && atomicConversion?.fromXMLToYAML !== undefined
          ) {
            const normalized = runWithConfigurationIndexPropertyContext(
              sourceContext,
              propertyRule.yaml ?? key,
              configurationIndexUidSegment,
              (propertyContext) => atomicConversion.fromXMLToYAML!({
                context: propertyContext,
                value,
              }),
              { configurationIndexAddressing: nestedConfigurationIndexAddressing },
            )
            fusedRepresentationValue = normalized.representationValue
          }
          const usesFusedRepresentation = usedFusedAtomic
          if (usesFusedRepresentation) {
            recordFusedXMLToYAML(params.profile, propertyRule.type, fusedStartedAt)
          }
          addProfileTime(params.profile, "defaultMs", defaultStartedAt)

          const exportStartedAt = performance.now()
          const siblingValue = (propertyKey: string): unknown => {
            const prepared = params.dependencies?.propertyValue?.(yamlPath, propertyKey)
            if (prepared !== undefined) return prepared.value
            const siblingYaml = rule.properties[propertyKey]?.yaml
            return siblingYaml === undefined ? undefined : result?.[siblingYaml] ?? retainedSiblingValues.get(siblingYaml)
          }
          const propertyOwner = metadataTargetOwnerForProperty({
            rule: propertyRule,
            siblingValue,
            owner,
          })
          const yamlValueBeforeMetadataTargets = clearedMetadataTarget
            ? null
            : usesFusedRepresentation
            ? fusedRepresentationValue
            : !convertedDirectly
            ? exportPropertyValueBeforeMetadataTargetsToYAML({
                context: sourceContext,
                rule: propertyRule,
                value,
                name: itemName,
                owner: propertyOwner,
                execution: params.execution,
                compiled,
                preserveImplicitValue: preserveExplicitDefault,
                annotations: params.annotations,
              })
            : value
          const yamlProjection = !convertedDirectly
            ? projectPropertyMetadataTargetsToYAML({
                context: sourceContext,
                rule: propertyRule,
                value,
                name: itemName,
                owner: propertyOwner,
                execution: params.execution,
                compiled,
                preserveImplicitValue: preserveExplicitDefault,
                annotations: params.annotations,
              }, yamlValueBeforeMetadataTargets)
            : { value: yamlValueBeforeMetadataTargets, uuidOccurrences: [] }
          const yamlValue = yamlProjection.value
          const finalize = compiled === undefined
            ? typeRule(propertyRule.type, "finalizeImportedYAML")
            : compiled.operations.finalizeImportedYAML
          const requiresFinalization = compiled === undefined
            ? typeRule(propertyRule.type, "requiresImportedYAMLFinalization")
            : compiled.operations.requiresImportedYAMLFinalization
          const shouldFinalize = finalize !== undefined
            && (requiresFinalization === undefined || requiresFinalization({ value: yamlValue }))
          const convertedYamlValue = params.dependencies !== undefined && shouldFinalize
            ? finalize({
                context: sourceContext,
                rule: propertyRule,
                value: yamlValue,
                ...(sourceContext.importFromYAML?.formDataPathIndex === undefined
                  ? {}
                  : { formDataPathIndex: sourceContext.importFromYAML.formDataPathIndex }),
              })
            : yamlValue
          const preparedProperty = preparedPropertyDecision
          if (preparedProperty?.value !== undefined && preparedProperty.value !== convertedYamlValue) {
            copyXmlAnomalyAnnotationsDeep(params.annotations, convertedYamlValue, preparedProperty.value)
          }
          const exportedYamlValue = preparedProperty?.present === true
            ? preparedProperty.value
            : preparedProperty?.present === false
              ? undefined
              : convertedYamlValue
          if (propertyRule.externalFile !== undefined) externalValue = exportedYamlValue
          if (
            claimedCanonicalRawDefault
            && exportedYamlValue === undefined
            && isXmlElementNode(xmlNode)
            && xmlNode.attributes.length === 0
            && xmlNode.content.length === 0
          ) {
            structurallyClaimed = true
            proofReady = false
          }
          if (params.mode === "facts" && exportedYamlValue !== null && typeof exportedYamlValue === "object") {
            if (
              propertyRule.externalFile
              || propertyRule.derivedFrom?.externalFile
              || !canExportPropertyToYAML({ context: sourceContext, rule: propertyRule })
            ) {
              acceptNestedPropertyFactLeaves({
                facts: params.facts,
                itemType: rule.itemType,
                itemRule: rule,
                propertyKey: key,
                yamlPath: propertyYamlPath,
                value: exportedYamlValue,
                presentInXML,
                retainContainers: false,
              })
            }
          } else if (params.facts !== undefined) {
            const fact: DirectImportPropertyFact = {
                itemType: rule.itemType,
                itemRule: rule,
                propertyKey: key,
                yamlPath: propertyYamlPath,
                value: exportedYamlValue,
                ...(yamlValueTag(exportedYamlValue) === undefined
                  ? {}
                  : { scalarTag: yamlValueTag(exportedYamlValue) }),
                presentInXML,
                ...(cleanValue === undefined
                && importedValue !== undefined
                ? { reconstructionValue: importedValue }
                : {}),
            }
            if (params.mode === "facts") pendingScalarFact = fact
            else params.facts?.acceptProperty(fact)
          }
          if (shouldImportForLocalProof && !shouldImportProperty) return
          if (!convertedDirectly && !usesFusedRepresentation) {
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
          const exportedValues = preparedProperty?.present === true && typeof propertyRule.yaml === "string"
            ? { [propertyRule.yaml]: exportedYamlValue }
            : getExportToYAMLResult(
                propertyRule,
                propertyRule.yaml!,
                exportedYamlValue,
                value,
                params.execution,
                compiled,
              )
          if (
            exportedValues !== undefined &&
            preparedProperty?.scalarTag !== undefined &&
            typeof propertyRule.yaml === "string"
          ) {
            markYAMLScalarTag(exportedValues, propertyRule.yaml, preparedProperty.scalarTag)
          }
          if (exportedValues !== undefined && params.dependencies?.propertyValue !== undefined
            && propertyRule.yaml !== undefined && isTypeOwnedMetadataTargetUnavailable({ rule: propertyRule, siblingValue })) {
            delete exportedValues[propertyRule.yaml]
          }
          const emptyDirectValue = convertedDirectly && (
            exportedYamlValue === undefined || isEmptySemanticContainer(exportedYamlValue)
          )
          const discardedAlternative = ambiguousXMLKey && emptyDirectValue
          if (exportedValues === undefined || discardedAlternative) {
            if (discardedAlternative) {
              params.annotations?.deleteSubtree(exportedYamlValue)
              discardAttempt = true
            }
            if (
              presentInXML &&
              emptyDirectValue &&
              !claimedCanonicalRawDefault &&
              isXmlElementNode(xmlNode) &&
              params.audit !== undefined
            ) {
              params.audit.elideSubtree(xmlNode, boundary)
            }
            return
          }
          if (params.mode === "facts") {
            for (const [yamlKey, exportedValue] of Object.entries(exportedValues)) {
              if (
                pendingScalarFact !== undefined
                && !Object.hasOwn(pendingScalarFact, "reconstructionValue")
                && propertyYamlPath.length === yamlPath.length + 1
                && propertyYamlPath[yamlPath.length] === yamlKey
                && Object.is(exportedValue, exportedYamlValue)
              ) {
                params.facts?.acceptProperty({ ...pendingScalarFact, exportedToYAML: true })
                pendingScalarFact = undefined
                continue
              }
              if (pendingScalarFact !== undefined) {
                params.facts?.acceptProperty(pendingScalarFact)
                pendingScalarFact = undefined
              }
              acceptNestedPropertyFactLeaves({
                facts: params.facts,
                itemType: rule.itemType,
                itemRule: rule,
                propertyKey: key,
                yamlPath: [...yamlPath, yamlKey],
                value: exportedValue,
                presentInXML,
                retainContainers: true,
                exportedToYAML: true,
              })
            }
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
            const propertyLogicalAddress = indexCollection === undefined
              ? undefined
              : configurationIndexPropertyXmlStateUid(
                  indexCollection.logicalAddress,
                  key,
                  propertyRule.yaml,
                  indexCollection.yamlPathAddressing === true || propertyRule.configurationIndexAddressing === "yamlPath",
                )
            const candidate = {
              itemType: rule.itemType,
              ...(itemName === undefined ? {} : { itemName }),
              itemYamlPath: yamlPath,
              propertyKey: key,
              yamlPath: propertyYamlPath,
              ...(propertyLogicalAddress === undefined ? {} : { logicalAddress: propertyLogicalAddress }),
              xmlValue: sourceXMLValue,
              presentInXML,
            }
            if (params.dependencies !== undefined) {
              if (params.dependencies.shouldOmit(candidate, exportedValues)) {
                semanticOmitted = true
                return
              }
            } else {
              params.dependent?.accept(candidate)
            }
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
          if (
            params.dependencies === undefined &&
            shouldFinalize
          ) {
            deferred?.accept({ valuePath: propertyYamlPath, rulePath: propertyRulePath })
          }
          for (const [yamlKey, exportedValue] of Object.entries(exportedValues)) {
            if (retainedSiblingYamlKeys.has(yamlKey)) retainedSiblingValues.set(yamlKey, exportedValue)
          }
          if (result !== undefined) {
            Object.assign(result, exportedValues)
            copyYAMLRuntimeMetadata(exportedValues, result)
            if (params.annotations !== undefined && yamlProjection.uuidOccurrences.length > 0) {
              assignMetadataTargetUuidAnnotations({
                yaml: result,
                annotations: params.annotations,
                occurrences: yamlProjection.uuidOccurrences,
              })
            }
          }
          addProfileTime(params.profile, "collectorMs", collectorStartedAt)
        } catch (cause) {
          if (cause instanceof XmlImportAttemptInfrastructureError || cause instanceof DirectImportRoundTripError) throw cause
          throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, xmlPath, cause)
        } finally {
          if (pendingScalarFact !== undefined) params.facts?.acceptProperty(pendingScalarFact)
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
        return { proofReady: false, structurallyClaimed: false, semanticOmitted: false }
      }
      throw cause
    }
    if (discardAttempt) {
      attempt.rollback()
      return { proofReady: false, structurallyClaimed: false, semanticOmitted: false }
    }
    attempt.commit()
    return { proofReady, structurallyClaimed, semanticOmitted, externalValue }
  }

  const importMatch = (match: Parameters<typeof importMatchUnprofiled>[0]): void => {
    const frame = beginPropertyTypeProfile(params.profile, match.entry.rule.type)
    try {
      const imported = importMatchUnprofiled(match)
      if (roundTrip !== undefined) {
        const canonicalParent = match.presentInXML
          ? undefined
          : canonicalRawDefaultParent(match.sourceState.xmlNode, match.entry.rule)
        const binding = {
          propertyKey: match.entry.propertyKey,
          externalValue: imported.externalValue,
          node: canonicalParent?.node ?? match.xmlNode,
          presentInXML: canonicalParent !== undefined || match.presentInXML,
          xmlPath: canonicalParent?.path ?? match.xmlPath,
          ...(match.xmlNodes === undefined ? {} : { nodes: match.xmlNodes }),
          ...(match.xmlOwnerNode === undefined ? {} : { owner: match.xmlOwnerNode }),
          ...(imported.semanticOmitted ? { semanticOmitted: true as const } : {}),
          ...(imported.structurallyClaimed || canonicalParent !== undefined
            ? { structurallyClaimed: true as const }
            : {}),
        }
        runRoundTripStep("bind", () => roundTrip.bind?.(binding))
        if (imported.proofReady && canonicalParent === undefined) {
          runRoundTripStep("ready", () => roundTrip.ready(binding))
        }
      }
    } finally {
      finishPropertyTypeProfile(params.profile, frame, "XML → YAML")
    }
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
      xmlOwnerNode: undefined,
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
      isRepeatable: (entry) => {
        if ("flags" in entry) return (entry as CompiledProperty).flags.repeatableXMLNodes
        const propertyRule = entry.rule
        return typeRule(propertyRule.type, "yamlToXMLNestedRule")?.kind === "collection"
          || typeRule(propertyRule.type, "fileChildNamesDescriptor") !== undefined
          || typeRule(propertyRule.type, "xmlImportPropertyBehavior")?.repeatedXMLNodes === true
      },
      useStructuralXMLValue: (entry, node) => {
        if (params.audit === undefined || isPlainXmlTextElement(node)) return true
        if ("flags" in entry) {
          const flags = (entry as CompiledProperty).flags
          return flags.nestedItemsOwnXMLNode
        }
        const { canonicalXMLKey, rule: propertyRule } = entry
        const nestedRule = typeRule(propertyRule.type, "yamlToXMLNestedRule")
        return nestedRule?.kind === "item" && typeRule(propertyRule.type, "nestedItemRule") !== undefined
          || nestedRule?.kind === "collection" && (
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
          xmlOwnerNode: match.xmlOwnerNode,
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
      const resolveNestedSources = "operations" in entry
        ? (entry as CompiledProperty).operations.resolveNestedImportXMLSources
        : typeRule(entry.rule.type, "resolveNestedImportXMLSources")
      const sourceNodes = resolveNestedSources === undefined
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

  if (result === undefined) return undefined
  if (params.dependencies?.propertyValue === undefined) normalizeTypeOwnedMetadataTargets({ result, rule })
  const orderedResult = orderYamlRuleProperties(
    result,
    compiledPlan?.yamlOrder ?? getYamlRulePropertyOrder(rule),
    params.annotations,
  )
  params.beforeFinish?.(orderedResult)
  if (roundTrip !== undefined) runRoundTripStep("finish", () => roundTrip.finish())
  return orderedResult
}

function acceptReconstructionPropertyFact(params: {
  readonly facts: NonNullable<DirectImportTraversal["facts"]>
  readonly sourceContext: ConfigurationContextFromXML
  readonly propertyRule: PropertyRule
  readonly propertyKey: string
  readonly configurationIndexUidSegment: string | undefined
  readonly nestedConfigurationIndexAddressing: PropertyRule["configurationIndexAddressing"]
  readonly sourceXMLValue: unknown
  readonly ownerXmlName: string | undefined
  readonly execution: CompiledPropertyRuleExecution | undefined
  readonly compiled: CompiledProperty | undefined
  readonly itemRule: MetadataItemRule
  readonly yamlPath: YamlPath
  readonly presentInXML: boolean
}): void {
  const value = runWithConfigurationIndexPropertyContext(
    params.sourceContext,
    params.propertyRule.yaml ?? params.propertyKey,
    params.configurationIndexUidSegment,
    (propertyContext) => importPropertyFromXML({
      context: propertyContext,
      rule: params.propertyRule,
      value: params.sourceXMLValue,
      name: params.propertyKey,
      ownerXmlName: params.ownerXmlName,
      execution: params.execution,
      compiled: params.compiled,
    }),
    { configurationIndexAddressing: params.nestedConfigurationIndexAddressing },
  )
  params.facts.acceptProperty({
    itemType: params.itemRule.itemType,
    itemRule: params.itemRule,
    propertyKey: params.propertyKey,
    yamlPath: params.yamlPath,
    value,
    presentInXML: params.presentInXML,
  })
}

class DirectImportRoundTripError extends Error {
  constructor(phase: string, cause: unknown) {
    super(`Ошибка локальной проверки XML (${phase}): ${cause instanceof Error ? cause.message : String(cause)}`, { cause })
    this.name = "DirectImportRoundTripError"
  }
}

function runRoundTripStep<T>(phase: "open" | "bind" | "ready" | "finish", run: () => T): T {
  try {
    return run()
  } catch (cause) {
    if (cause instanceof DirectImportRoundTripError) throw cause
    throw new DirectImportRoundTripError(phase, cause)
  }
}

function metadataTargetSiblingYamlKeys(rule: MetadataItemRule): ReadonlySet<string> {
  const result = new Set<string>()
  for (const propertyRule of Object.values(rule.properties)) {
    const constraint = propertyRule.metadataTarget
    const typeProperty = constraint?.kind === "member" ? constraint.typeProperty : undefined
    if (typeProperty === undefined) continue
    const yamlKey = rule.properties[typeProperty]?.yaml
    if (yamlKey !== undefined) result.add(yamlKey)
  }
  return result
}

function claimCanonicalRawDefault(params: {
  audit: XmlImportAuditSession | undefined
  boundary: XmlImportAuditBoundary
  node: XmlImportAuditedNode | undefined
  rule: PropertyRule
}): boolean {
  if (
    !isXmlElementNode(params.node)
    || !Object.prototype.hasOwnProperty.call(params.rule, "defaultValueXMLRaw")
    || !sameCanonicalXmlValue(encodeXmlRawElement(params.node), params.rule.defaultValueXMLRaw)
  ) return false
  if (params.audit !== undefined) claimAuditedSubtree(params.audit, params.node, params.boundary)
  return true
}

function canonicalRawDefaultParent(
  root: XmlImportAuditedNode | undefined,
  rule: PropertyRule,
): { readonly node: XmlElementNode; readonly path: readonly string[] } | undefined {
  if (
    !isXmlElementNode(root)
    || !Object.prototype.hasOwnProperty.call(rule, "defaultValueXMLRaw")
    || rule.xmlParents === undefined
    || rule.xmlParents.length === 0
  ) return undefined
  let node = root
  for (const name of rule.xmlParents) {
    const matches = node.content.filter(
      (child): child is XmlElementNode => child.type === "element" && child.name === name,
    )
    if (matches.length !== 1) return undefined
    node = matches[0]!
  }
  return sameCanonicalXmlValue(encodeXmlRawElement(node), rule.defaultValueXMLRaw)
    ? { node, path: rule.xmlParents }
    : undefined
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

function getOwnerXmlName(xml: DirectImportXMLSource["xml"]): string | undefined {
  if (isXmlElementNode(xml)) return xmlAttributeValue(xml, "name")
  return typeof xml._name === "string" ? xml._name : undefined
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

function recordFusedXMLToYAML(
  profile: DirectImportProfile | undefined,
  propertyType: string,
  startedAt: number | undefined,
): void {
  if (profile === undefined) return
  profile.fusedAtomicCount++
  addProfileBucket(
    profile.fusedAtomicByType,
    propertyType,
    startedAt === undefined ? 0 : performance.now() - startedAt,
  )
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
