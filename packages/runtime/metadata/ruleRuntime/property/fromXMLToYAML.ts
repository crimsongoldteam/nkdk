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
import { canExportPropertyToYAML, exportPropertyValueToYAML, getExportToYAMLResult } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { getXMLImportPlan, visitXMLImportPlan, type XMLImportPlanEntry } from "./xmlImportPlan"
import { sortYamlRuleProperties } from "./yamlPropertyOrder"
import { enterNestedYamlRule } from "./yamlRuleCursor"
import type { LocalIndexesCollector } from "../../projectDefinition/localIndexes"
import type { YamlPath } from "../../diagnostics/types"
import type { DeferredValuePathCollector } from "./importYamlTypes"
import {
  copyYAMLScalarTags,
  markYAMLScalarTag,
  xmlAnomalyTagValue,
} from "../../../yaml/scalarTags"
import {
  matchExplicitXMLPropertyFromXML,
  matchExplicitXMLPropertyTypeFromXML,
  matchExplicitXMLTransportFromXML,
} from "./explicitXMLPropertyRegistry"
import { isDependentImportProperty } from "./dependentItemRegistry"
import type { PropertyRuleExecution } from "./fn"
import { currentPropertyRuleRegistrySet } from "./propertyRuleExecutionContext"

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
  execution?: PropertyRuleExecution
}): Record<string, unknown> | undefined {
  const { context, rule, sources, itemName, yamlPath, rulePath, collector, deferred, propertyXML } = params
  if (sources.length === 0) return undefined
  const brokenReferenceRegistry = params.execution ?? currentPropertyRuleRegistrySet<Pick<
    PropertyRuleExecution,
    "normalizeImportedBrokenXMLReferences"
  >>()
  const typeRule = <Operation extends import("./fn").TypeRulesOperations>(
    type: import("./types").PropertyRule["type"],
    operation: Operation,
  ) => params.execution === undefined
    ? getTypeRule(type, operation)
    : params.execution.getTypeRule(type, operation)

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
    return {
      source,
      plan,
      indexCollection,
      xmlNodeLogicalAddress:
        indexCollection === undefined ? undefined : getConfigurationIndexCollectionXmlNodeLogicalAddress(indexCollection),
      ownerXmlName: getOwnerXmlName(source.xml),
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
    presentInXML: boolean
    ambiguousXMLKey: boolean
  }): void => {
    if (params.profile !== undefined) params.profile.propertyCount++
    const { sourceState, entry, sourceXMLKey, xmlPath, sourceXMLValue, presentInXML } = match
    const { propertyKey: key, rule: propertyRule } = entry
    const explicitXMLParams = {
      itemType: rule.itemType,
      propertyKey: key,
      presentInXML,
      xmlValue: sourceXMLValue,
    }
    const explicitXMLByProperty = params.execution === undefined
      ? matchExplicitXMLPropertyFromXML(explicitXMLParams)
      : params.execution.matchExplicitXMLPropertyFromXML(explicitXMLParams)
    const explicitXMLTransport = params.execution === undefined
      ? matchExplicitXMLTransportFromXML(explicitXMLParams)
      : params.execution.matchExplicitXMLTransportFromXML(explicitXMLParams)
    const dependentImportProperty = params.execution === undefined
      ? isDependentImportProperty(rule.itemType, key)
      : params.execution.isDependentImportProperty(rule.itemType, key)
    const nestedRule = typeRule(propertyRule.type, "yamlToXMLNestedRule")
    const nestedConfigurationIndexAddressing =
      propertyRule.configurationIndexAddressing ??
      (nestedRule !== undefined && "configurationIndexAddressing" in nestedRule
        ? nestedRule.configurationIndexAddressing
        : undefined)
    const { source, indexCollection, ownerXmlName } = sourceState
    const { context: sourceContext } = source
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

    const shouldImportForReference = forReference && propertyRule.fromXML === false && presentInXML
    if (
      !shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" }) &&
      !shouldImportForReference &&
      explicitXMLByProperty === undefined &&
      propertyXML?.has(key) !== true
    )
      return

    const propertyYamlPath = [...yamlPath, propertyRule.yaml ?? key]
    const propertyRulePath = [...rulePath, { propertyKey: key }]
    const hasExplicitXMLKeyWithEmptyDefault = "defaultValueXMLEmpty" in propertyRule && presentInXML
    const hasRawEmptyXML = hasExplicitXMLKeyWithEmptyDefault && (xmlValue === undefined || xmlValue === "")
    try {
      const direct = typeRule(propertyRule.type, "importFromXMLToYAML")
      const resolveNestedSources = typeRule(propertyRule.type, "resolveNestedImportXMLSources")
      const convertedDirectly = resolveNestedSources !== undefined || direct !== undefined
      let importedValue: unknown
      if (explicitXMLTransport !== undefined) {
        importedValue = undefined
      } else if (resolveNestedSources !== undefined) {
        const nested = typeRule(propertyRule.type, "nestedItemRule")
        if (nested === undefined || !("itemRule" in nested)) {
          throw new Error(`Для ${propertyRule.type} не зарегистрировано фиксированное вложенное правило`)
        }
        const startedAt = performance.now()
        const nestedTraversal = enterNestedYamlRule(
          {
            yamlPath: propertyYamlPath,
            rulePath: propertyRulePath,
            collector,
            deferred,
            profile: params.profile,
          },
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
                xml: xmlValue,
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
              profile: params.profile,
              execution: params.execution,
            }),
          { configurationIndexAddressing: nestedConfigurationIndexAddressing }
        )
        const elapsedMs = performance.now() - startedAt
        const profile = params.profile
        if (profile !== undefined) {
          profile.directCount++
          profile.directInclusiveMs += elapsedMs
          addProfileBucket(profile.directByType, propertyRule.type, elapsedMs)
        }
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
              traversal: {
                yamlPath: propertyYamlPath,
                rulePath: propertyRulePath,
                collector,
                deferred,
                dependent: params.dependent,
                profile: params.profile,
                execution: params.execution,
              },
            }),
          { configurationIndexAddressing: nestedConfigurationIndexAddressing }
        )
        const elapsedMs = performance.now() - startedAt
        const profile = params.profile
        if (profile !== undefined) {
          profile.directCount++
          profile.directInclusiveMs += elapsedMs
          addProfileBucket(profile.directByType, propertyRule.type, elapsedMs)
        }
      }
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
      const yamlValue = clearedMetadataTarget
        ? null
        : !convertedDirectly
        ? exportPropertyValueToYAML({
            context: sourceContext,
            rule: propertyRule,
            value,
            name: itemName,
            owner: propertyOwner,
            execution: params.execution,
            preserveImplicitValue: preserveExplicitDefault,
          })
        : value
      const explicitXML =
        explicitXMLByProperty ??
        (params.execution === undefined
          ? matchExplicitXMLPropertyTypeFromXML({
              propertyType: propertyRule.type,
              presentInXML,
              yamlValue,
            })
          : params.execution.matchExplicitXMLPropertyTypeFromXML({
          propertyType: propertyRule.type,
          presentInXML,
          yamlValue,
            }))
      const transported =
        explicitXML === undefined && explicitXMLTransport === undefined && brokenReferenceRegistry !== undefined
          ? brokenReferenceRegistry.normalizeImportedBrokenXMLReferences({
              rule: propertyRule,
              xmlValue,
              yamlValue,
            })
          : {
              yamlValue: explicitXMLTransport === undefined
                ? explicitXML?.yamlValue ?? yamlValue
                : xmlAnomalyTagValue("xml/value", explicitXMLTransport),
              taggedPaths: [],
            }
      const exportedYamlValue = transported.yamlValue
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
          if (entry !== null) externalFiles.push(entry)
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
        explicitXML === undefined &&
        explicitXMLTransport === undefined &&
        !canExportPropertyToYAML({ context: sourceContext, rule: propertyRule })
      ) return
      const outputStartedAt = performance.now()
      const exportedValues =
        explicitXML === undefined && explicitXMLTransport === undefined
          ? getExportToYAMLResult(
              propertyRule,
              propertyRule.yaml!,
              exportedYamlValue,
              value,
              params.execution,
            )
          : { [propertyRule.yaml!]: exportedYamlValue }
      if (exportedValues === undefined) return
      Object.assign(result, exportedValues)
      copyYAMLScalarTags(exportedValues, result)
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
      if (explicitXML !== undefined || explicitXMLTransport !== undefined) {
        const tag = explicitXMLTransport !== undefined
          ? "xml/value"
          : explicitXML?.action === "omit"
            ? "xml/absent"
            : "xml/present"
        markYAMLScalarTag(result, propertyRule.yaml!, tag)
      }
      for (const path of transported.taggedPaths) {
        markRelativeYAMLScalarTag(result, propertyRule.yaml!, path)
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
      addProfileTime(params.profile, "collectorMs", collectorStartedAt)
    } catch (cause) {
      throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, xmlPath, cause)
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
      xml: sourceState.source.xml,
      visit(match) {
        sourceState.foundPropertyKeys.add(match.propertyKey)
        const conversionStartedAt = performance.now()
        importMatch({
          sourceState,
          entry: match,
          sourceXMLKey: match.sourceXMLKey,
          xmlPath: match.xmlPath,
          sourceXMLValue: match.xmlValue,
          presentInXML: true,
          ambiguousXMLKey: match.ambiguousXMLKey,
        })
        conversionMs += performance.now() - conversionStartedAt
      },
    })
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  if (propertyXML !== undefined) {
    const traversalStartedAt = performance.now()
    let conversionMs = 0
    for (const [propertyKey, sourceXMLValue] of propertyXML) {
      const sourceState = sourceByProperty === undefined ? sourceStates[0] : sourceByProperty.get(propertyKey)
      const entry = sourceState?.plan.entriesByPropertyKey.get(propertyKey)
      if (sourceState === undefined || entry === undefined) continue
      sourceState.foundPropertyKeys.add(propertyKey)
      const conversionStartedAt = performance.now()
      importMatch({
        sourceState,
        entry,
        sourceXMLKey: entry.canonicalXMLKey,
        xmlPath: [entry.canonicalXMLKey],
        sourceXMLValue,
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
    for (const entry of sourceState.plan.entriesByPropertyKey.values()) {
      if (sourceState.foundPropertyKeys.has(entry.propertyKey)) continue
      if (
        matchExplicitXMLPropertyFromXML({
          itemType: rule.itemType,
          propertyKey: entry.propertyKey,
          presentInXML: false,
          xmlValue: undefined,
        }) === undefined
      ) {
        continue
      }
      conversionMs += importMissingEntry(sourceState, entry)
    }
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  normalizeTypeOwnedMetadataTargets({ result, rule })
  return sortYamlRuleProperties(result)
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

function markRelativeYAMLScalarTag(
  result: Record<string, unknown>,
  propertyKey: string,
  path: YamlPath,
): void {
  if (path.length === 0) {
    markYAMLScalarTag(result, propertyKey, "xml/reference")
    return
  }
  let parent: unknown = result[propertyKey]
  for (const segment of path.slice(0, -1)) {
    if (typeof parent !== "object" || parent === null) {
      throw new Error(`Не найден YAML-путь переносчика: ${[propertyKey, ...path].join("/")}`)
    }
    parent = (parent as Record<string | number, unknown>)[segment]
  }
  const key = path[path.length - 1]
  if (typeof parent !== "object" || parent === null || key === undefined) {
    throw new Error(`Не найден YAML-путь переносчика: ${[propertyKey, ...path].join("/")}`)
  }
  markYAMLScalarTag(parent, key, "xml/reference")
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
