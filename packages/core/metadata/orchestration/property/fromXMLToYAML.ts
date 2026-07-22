import { performance } from "node:perf_hooks"
import { capitalize } from "../../../helpers/capitalize"
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
import { getOrderedKeysFromXML, getValueOrDefault, presenceAffectsExport, shouldProcessProperty } from "./helpers"
import type { DeferredRulePathSegment, DirectImportProfile, DirectImportXMLSource } from "./importYamlTypes"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { importPropertyFromXML } from "./fromXML"
import { canExportPropertyToYAML, exportPropertyValueToYAML, getExportToYAMLResult } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
import { enterNestedYamlRule } from "./yamlRuleCursor"
import type { LocalIndexesCollector } from "../../project/localIndexes"
import type { YamlPath } from "../../validation/yamlLocations"

export class DirectImportConversionError extends Error {
  constructor(
    readonly yamlPath: YamlPath,
    readonly rulePath: readonly DeferredRulePathSegment[],
    cause: unknown
  ) {
    const yaml = `/${yamlPath.map(String).join("/")}`
    const rule = `/${rulePath.map(({ propertyKey }) => propertyKey).join("/")}`
    super(`Ошибка XML → YAML: yamlPath=${yaml}, rulePath=${rule}: ${errorMessage(cause)}`, { cause })
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

  const orderingStartedAt = performance.now()
  const sourceStates = sources.map((source) => {
    const indexCollection = getConfigurationIndexCollectionContext(source.context)
    return {
      source,
      orderedKeys: getOrderedKeysFromXML({ rule, xml: source.xml, tags: source.tags }),
      indexCollection,
      xmlNodeLogicalAddress:
        indexCollection === undefined ? undefined : getConfigurationIndexXmlNodeLogicalAddress(indexCollection),
      ownerXmlName: getOwnerXmlName(source.xml),
      importedKeysInSourceOrder: [] as string[],
    }
  })
  addProfileTime(params.profile, "orderingMs", orderingStartedAt)
  const selectionStartedAt = performance.now()
  const sourceByProperty = new Map<string, (typeof sourceStates)[number]>()
  for (const [key, propertyRule] of Object.entries(rule.properties)) {
    const matchingSources = sourceStates.filter(
      ({ source, orderedKeys }) =>
        sourceMatchesProperty(source, propertyRule, sources.length) &&
        (orderedKeys.includes(key) || propertyXML?.has(key) === true)
    )
    if (matchingSources.length > 1) {
      throw new Error(`Для свойства ${key} найдено несколько XML-источников`)
    }
    if (matchingSources[0] !== undefined) sourceByProperty.set(key, matchingSources[0])
  }
  const propertyKeys = Object.keys(rule.properties).filter((key) => sourceByProperty.has(key))
  addProfileTime(params.profile, "selectionMs", selectionStartedAt)
  for (const key of propertyKeys) {
    if (params.profile !== undefined) params.profile.propertyCount++
    const propertyRule = rule.properties[key]
    const sourceState = sourceByProperty.get(key)!
    const { source, indexCollection, xmlNodeLogicalAddress, ownerXmlName, importedKeysInSourceOrder } = sourceState
    const { context: sourceContext, xml } = source
    const externalXmlValue = propertyXML?.get(key)
    const sourceXmlKey =
      externalXmlValue === undefined ? getXMLKey(key, xml, propertyRule) : (propertyRule.xml ?? capitalize(key))
    const sourceXmlValue =
      externalXmlValue ?? (sourceXmlKey === undefined ? undefined : getXMLValueByKey(sourceXmlKey, xml, propertyRule))
    const identityStartedAt = performance.now()
    collectConfigurationIndexIdentityFromXML({ context: sourceContext, sourceXmlKey, xmlValue: sourceXmlValue })
    addProfileTime(params.profile, "configurationIndexMs", identityStartedAt)

    if (!forReference && propertyRule.forReferenceOnly === true) continue

    if (indexCollection !== undefined && sourceXmlKey !== undefined) {
      const indexStartedAt = performance.now()
      importedKeysInSourceOrder.push(key)
      const canonicalXmlKey = propertyRule.xml ?? capitalize(key)
      if (sourceXmlKey !== canonicalXmlKey)
        indexCollection.collector.setAlias(xmlNodeLogicalAddress!, key, sourceXmlKey)
      if (
        presenceAffectsExport({
          rule: propertyRule,
          sourceXmlValue,
          typeBehavior: getTypeRule(propertyRule.type, "xmlImportPropertyBehavior"),
        })
      ) {
        indexCollection.collector.setPresent(xmlNodeLogicalAddress!, key)
      }
      addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
    }

    let xmlValue = sourceXmlValue
    if (
      xmlValue === undefined &&
      propertyRule.type === "MetadataDcsMetadataValue" &&
      isXMLKeyPresent(key, xml, propertyRule)
    ) {
      xmlValue = null
    }
    if (xmlValue === undefined && propertyRule.type === "MetadataValue" && isXMLKeyPresent(key, xml, propertyRule)) {
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
    if (sourceXmlKey !== undefined) {
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
      (xmlValue !== undefined || isXMLKeyPresent(key, xml, propertyRule))
    if (
      !shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" }) &&
      !shouldImportForReference &&
      externalXmlValue === undefined
    )
      continue

    const propertyYamlPath = [...yamlPath, propertyRule.yaml ?? key]
    const propertyRulePath = [...rulePath, { propertyKey: key }]
    const hasExplicitXMLKeyWithEmptyDefault = "defaultValueXMLEmpty" in propertyRule && sourceXmlKey !== undefined
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
        sourceXmlKey !== undefined &&
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
        continue
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
          continue
        }
        addProfileTime(params.profile, "outputMs", outputStartedAt)
      }

      if (!canExportPropertyToYAML({ context: sourceContext, rule: propertyRule })) continue
      const outputStartedAt = performance.now()
      const exportedValues = getExportToYAMLResult(propertyRule, propertyRule.yaml!, yamlValue, value)
      if (exportedValues === undefined) continue
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
      throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, cause)
    }
  }

  for (const { indexCollection, xmlNodeLogicalAddress, orderedKeys, importedKeysInSourceOrder } of sourceStates) {
    if (indexCollection === undefined || importedKeysInSourceOrder.length === 0) continue
    const indexStartedAt = performance.now()
    const sourceOrder = orderedKeys.filter((key) => importedKeysInSourceOrder.includes(key))
    const externalOrder = importedKeysInSourceOrder.filter((key) => !sourceOrder.includes(key))
    indexCollection.collector.setOrder(xmlNodeLogicalAddress!, [...sourceOrder, ...externalOrder])
    addProfileTime(params.profile, "configurationIndexMs", indexStartedAt)
  }

  return result
}

function sourceMatchesProperty(source: DirectImportXMLSource, rule: PropertyRule, sourceCount: number): boolean {
  if (source.tags === undefined) return sourceCount === 1 || rule.tag === undefined
  return rule.tag !== undefined && source.tags.includes(rule.tag)
}

function getXMLKeys(key: string, rule: PropertyRule): string[] {
  return [rule.xml ?? capitalize(key), ...(rule.xmlAliases ?? [])]
}

function getXMLKey(key: string, xml: Record<string, unknown>, rule: PropertyRule): string | undefined {
  return getXMLKeys(key, rule).find((xmlKey) => isXMLKeyPresentByKey(xmlKey, xml, rule))
}

function getXMLValueByKey(xmlKey: string, xml: Record<string, unknown>, rule: PropertyRule): unknown {
  let currentXml: Record<string, unknown> | undefined = xml
  for (const xmlParent of rule.xmlParents ?? []) {
    const parent = currentXml?.[xmlParent]
    if (parent === undefined || parent === null || typeof parent !== "object" || Array.isArray(parent)) return undefined
    currentXml = parent as Record<string, unknown>
  }
  return currentXml?.[xmlKey]
}

function getOwnerXmlName(xml: Record<string, unknown>): string | undefined {
  return typeof xml._name === "string" ? xml._name : undefined
}

function isXMLKeyPresent(key: string, xml: Record<string, unknown>, rule: PropertyRule): boolean {
  return getXMLKey(key, xml, rule) !== undefined
}

function isXMLKeyPresentByKey(xmlKey: string, xml: Record<string, unknown>, rule: PropertyRule): boolean {
  let currentXml: Record<string, unknown> | undefined = xml
  for (const xmlParent of rule.xmlParents ?? []) {
    const parent = currentXml?.[xmlParent]
    if (parent === undefined || parent === null || typeof parent !== "object" || Array.isArray(parent)) return false
    currentXml = parent as Record<string, unknown>
  }
  return currentXml !== undefined && xmlKey in currentXml
}

function addProfileTime(
  profile: DirectImportProfile | undefined,
  field: "orderingMs" | "selectionMs" | "configurationIndexMs" | "defaultMs" | "outputMs" | "collectorMs",
  startedAt: number
): void {
  if (profile === undefined) return
  profile[field] += performance.now() - startedAt
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
