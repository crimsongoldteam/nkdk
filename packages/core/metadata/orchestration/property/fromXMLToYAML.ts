import { performance } from "node:perf_hooks"
import {
  collectConfigurationIndexIdentityFromXML,
  collectConfigurationIndexImportedValue,
  collectConfigurationIndexPropertyFromXML,
} from "../../configurationIndex/collector/collectProperty"
import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexPropertyLogicalAddress,
  getConfigurationIndexXmlNodeLogicalAddress,
  runWithConfigurationIndexPropertyContext,
} from "../../configurationIndex/collector/context"
import type { ConfigurationContextFromXML } from "../../context/types"
import { buildExternalFileEntry } from "../../forms/commonObjects/dynamicList/externalFile"
import { getValueOrDefault, presenceAffectsExport, shouldProcessProperty } from "./helpers"
import type { DeferredRulePathSegment, DirectImportProfile, DirectImportXMLSource } from "./importYamlTypes"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { importPropertyFromXML } from "./fromXML"
import { canExportPropertyToYAML, exportPropertyValueToYAML, getExportToYAMLResult } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule } from "./types"
import {
  getXMLImportPlan,
  visitXMLImportPlan,
  type XMLImportPlanEntry,
} from "./xmlImportPlan"
import { sortYamlRuleProperties } from "./yamlPropertyOrder"
import { enterNestedYamlRule } from "./yamlRuleCursor"
import type { LocalIndexesCollector } from "../../project/localIndexes"
import type { YamlPath } from "../../validation/yamlLocations"

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
  profile?: DirectImportProfile
  propertyXML?: ReadonlyMap<string, unknown>
}): Record<string, unknown> | undefined {
  const { context, rule, sources, itemName, yamlPath, rulePath, collector, propertyXML } = params
  if (sources.length === 0) return undefined

  const result: Record<string, unknown> = {}
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name: itemName, context })
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
        indexCollection === undefined ? undefined : getConfigurationIndexXmlNodeLogicalAddress(indexCollection),
      ownerXmlName: getOwnerXmlName(source.xml),
      importedKeysInSourceOrder: [] as string[],
      foundPropertyKeys: new Set<string>(),
    }
  })
  const planningStartedAt = performance.now()
  const sourceByProperty =
    sourceStates.length === 1 ? undefined : new Map<string, (typeof sourceStates)[number]>()
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
  }): void => {
    if (params.profile !== undefined) params.profile.propertyCount++
    const { sourceState, entry, sourceXMLKey, xmlPath, sourceXMLValue, presentInXML } = match
    const { propertyKey: key, rule: propertyRule } = entry
    const { source, indexCollection, xmlNodeLogicalAddress, ownerXmlName, importedKeysInSourceOrder } = sourceState
    const { context: sourceContext } = source
    const identityStartedAt = performance.now()
    collectConfigurationIndexIdentityFromXML({
      context: sourceContext,
      sourceXmlKey: sourceXMLKey,
      xmlValue: sourceXMLValue,
    })
    addProfileTime(params.profile, "configurationIndexMs", identityStartedAt)

    if (!forReference && propertyRule.forReferenceOnly === true) return

    if (indexCollection !== undefined && sourceXMLKey !== undefined) {
      const indexStartedAt = performance.now()
      importedKeysInSourceOrder.push(key)
      if (sourceXMLKey !== entry.canonicalXMLKey)
        indexCollection.collector.setAlias(xmlNodeLogicalAddress!, key, sourceXMLKey)
      if (
        presenceAffectsExport({
          rule: propertyRule,
          sourceXmlValue: sourceXMLValue,
          typeBehavior: getTypeRule(propertyRule.type, "xmlImportPropertyBehavior"),
        })
      ) {
        indexCollection.collector.setPresent(xmlNodeLogicalAddress!, key)
      }
      addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
    }

    let xmlValue = sourceXMLValue
    if (
      xmlValue === undefined &&
      propertyRule.type === "MetadataDcsMetadataValue" &&
      presentInXML
    ) {
      xmlValue = null
    }
    if (xmlValue === undefined && propertyRule.type === "MetadataValue" && presentInXML) {
      xmlValue = { "_xsi:nil": true }
    }
    const propertyLogicalAddress =
      indexCollection === undefined ||
      (indexCollection.yamlPathAddressing !== true && propertyRule.configurationIndexAddressing !== "yamlPath")
        ? undefined
        : getConfigurationIndexPropertyLogicalAddress(
            indexCollection,
            propertyRule.yaml ?? key,
            propertyRule.configurationIndexAddressing
          )
    if (sourceXMLKey !== undefined) {
      const indexStartedAt = performance.now()
      collectConfigurationIndexPropertyFromXML({
        context: sourceContext,
        logicalAddress: propertyLogicalAddress,
        propertyKey: key,
        xmlValue,
        rule: propertyRule,
        descriptor: getTypeRule(propertyRule.type, "configurationIndexValueFromXML"),
      })
      addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
    }

    const shouldImportForReference =
      forReference &&
      propertyRule.fromXML === false &&
      presentInXML
    if (
      !shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" }) &&
      !shouldImportForReference &&
      propertyXML?.has(key) !== true
    )
      return

    const propertyYamlPath = [...yamlPath, propertyRule.yaml ?? key]
    const propertyRulePath = [...rulePath, { propertyKey: key }]
    const hasExplicitXMLKeyWithEmptyDefault = "defaultValueXMLEmpty" in propertyRule && presentInXML
    const hasRawEmptyXML = hasExplicitXMLKeyWithEmptyDefault && (xmlValue === undefined || xmlValue === "")
    const childCollection = rule.childCollections?.find((candidate) => candidate.propertyKey === key)
    const configurationIndexUidSegment =
      childCollection?.configurationIndexUidSegment ??
      propertyRule.configurationIndexUidSegment ??
      propertyRule.operationTarget?.migrationSegment

    try {
      const direct = getTypeRule(propertyRule.type, "importFromXMLToYAML")
      const resolveNestedSources = getTypeRule(propertyRule.type, "resolveNestedImportXMLSources")
      const convertedDirectly = resolveNestedSources !== undefined || direct !== undefined
      let importedValue: unknown
      if (resolveNestedSources !== undefined) {
        const nested = getTypeRule(propertyRule.type, "nestedItemRule")
        if (nested === undefined || !("itemRule" in nested)) {
          throw new Error(`Для ${propertyRule.type} не зарегистрировано фиксированное вложенное правило`)
        }
        const startedAt = performance.now()
        const nestedTraversal = enterNestedYamlRule(
          {
            yamlPath: propertyYamlPath,
            rulePath: propertyRulePath,
            collector,
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
              profile: params.profile,
            }),
          { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
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
          hasRawEmptyXML && propertyRule.emptyAsRawXML === true
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
                  }),
                { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
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
              traversal: { yamlPath: propertyYamlPath, rulePath: propertyRulePath, collector, profile: params.profile },
            }),
          { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
        )
        const elapsedMs = performance.now() - startedAt
        const profile = params.profile
        if (profile !== undefined) {
          profile.directCount++
          profile.directInclusiveMs += elapsedMs
          addProfileBucket(profile.directByType, propertyRule.type, elapsedMs)
        }
      }
      const rawValue =
        importedValue === undefined && hasExplicitXMLKeyWithEmptyDefault && !convertedDirectly
          ? propertyRule.defaultValueXMLEmpty
          : importedValue
      const preserveExplicitDefault =
        propertyRule.preserveExplicitDefaultXML === true &&
        presentInXML &&
        rawValue === propertyRule.defaultValueXML
      const cleanValue =
        !convertedDirectly && !forReference && rawValue === propertyRule.defaultValueXML && !preserveExplicitDefault
          ? undefined
          : rawValue
      const defaultStartedAt = performance.now()
      const value =
        !convertedDirectly && !forReference
          ? getValueOrDefault({
              context: sourceContext,
              rule: propertyRule,
              value: cleanValue,
              name: key,
              operation: "importFromXML",
            })
          : cleanValue
      addProfileTime(params.profile, "defaultMs", defaultStartedAt)

      if (value !== undefined) {
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
      const yamlValue = !convertedDirectly
        ? exportPropertyValueToYAML({
            context: sourceContext,
            rule: propertyRule,
            value,
            name: itemName,
            owner,
          })
        : value
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

      if (!canExportPropertyToYAML({ context: sourceContext, rule: propertyRule })) return
      const outputStartedAt = performance.now()
      const exportedValues = getExportToYAMLResult(propertyRule, propertyRule.yaml!, yamlValue, value)
      if (exportedValues === undefined) return
      Object.assign(result, exportedValues)
      const profile = params.profile
      if (profile !== undefined) profile.exportedCount++
      addProfileTime(params.profile, "outputMs", outputStartedAt)
      const collectorStartedAt = performance.now()
      collector.acceptProperty({
        yamlPath: propertyYamlPath,
        rulePath: propertyRulePath,
        rule: propertyRule,
        value: yamlValue,
      })
      addProfileTime(params.profile, "collectorMs", collectorStartedAt)
    } catch (cause) {
      throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, xmlPath, cause)
    }
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
      const conversionStartedAt = performance.now()
      importMatch({
        sourceState,
        entry,
        sourceXMLKey: undefined,
        xmlPath: undefined,
        sourceXMLValue: undefined,
        presentInXML: false,
      })
      conversionMs += performance.now() - conversionStartedAt
    }
    addProfileDuration(params.profile, "xmlTraversalMs", performance.now() - traversalStartedAt - conversionMs)
  }

  for (const { indexCollection, xmlNodeLogicalAddress, importedKeysInSourceOrder } of sourceStates) {
    if (indexCollection === undefined || importedKeysInSourceOrder.length === 0) continue
    const indexStartedAt = performance.now()
    indexCollection.collector.setOrder(xmlNodeLogicalAddress!, importedKeysInSourceOrder)
    addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
  }

  return sortYamlRuleProperties(result)
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
