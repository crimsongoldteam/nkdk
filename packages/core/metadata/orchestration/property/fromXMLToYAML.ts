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
import { getOrderedKeysFromXML, presenceAffectsExport, shouldProcessProperty } from "./helpers"
import type { DeferredRulePathSegment } from "./importYamlTypes"
import { metadataTargetOwnerFromRule } from "./metadataTargetString"
import { importPropertyFromXML } from "./fromXML"
import { canExportPropertyToYAML, exportPropertyValueToYAML, getExportToYAMLResult } from "./toYAML"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"
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
  xml: Record<string, unknown> | undefined
  itemName?: string
  yamlPath: YamlPath
  rulePath: readonly DeferredRulePathSegment[]
  collector: LocalIndexesCollector
  tags?: string[]
}): Record<string, unknown> | undefined {
  const { context, rule, xml, itemName, yamlPath, rulePath, collector, tags } = params
  if (!xml) return undefined

  const result: Record<string, unknown> = {}
  const indexCollection = getConfigurationIndexCollectionContext(context)
  const xmlNodeLogicalAddress =
    indexCollection === undefined ? undefined : getConfigurationIndexXmlNodeLogicalAddress(indexCollection)
  const ownerXmlName = getOwnerXmlName(xml)
  const owner = metadataTargetOwnerFromRule({ itemRule: rule, name: itemName, context })
  const forReference = context.fromXML.forReference
  const importedKeysInSourceOrder: string[] = []
  const importedExternalProperties = new Set<string>()

  for (const key of getOrderedKeysFromXML({ rule, xml, tags })) {
    const propertyRule = rule.properties[key]
    const sourceXmlKey = getXMLKey(key, xml, propertyRule)
    const sourceXmlValue =
      sourceXmlKey === undefined ? undefined : getXMLValueByKey(sourceXmlKey, xml, propertyRule)
    collectConfigurationIndexIdentityFromXML({ context, sourceXmlKey, xmlValue: sourceXmlValue })

    if (!forReference && propertyRule.forReferenceOnly === true) continue

    if (indexCollection !== undefined && sourceXmlKey !== undefined) {
      importedKeysInSourceOrder.push(key)
      const canonicalXmlKey = propertyRule.xml ?? capitalize(key)
      if (sourceXmlKey !== canonicalXmlKey) indexCollection.collector.setAlias(xmlNodeLogicalAddress!, key, sourceXmlKey)
      if (
        presenceAffectsExport({
          rule: propertyRule,
          sourceXmlValue,
          typeBehavior: getTypeRule(propertyRule.type, "xmlImportPropertyBehavior"),
        })
      ) {
        indexCollection.collector.setPresent(xmlNodeLogicalAddress!, key)
      }
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
    if (xmlValue === undefined && "defaultValueXML" in propertyRule) xmlValue = propertyRule.defaultValueXML

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
      collectConfigurationIndexPropertyFromXML({
        context,
        logicalAddress: propertyLogicalAddress,
        propertyKey: key,
        xmlValue,
        rule: propertyRule,
        descriptor: getTypeRule(propertyRule.type, "configurationIndexValueFromXML"),
      })
    }

    const shouldImportForReference =
      forReference &&
      propertyRule.fromXML === false &&
      (xmlValue !== undefined || isXMLKeyPresent(key, xml, propertyRule))
    if (!shouldProcessProperty({ rule: propertyRule, operation: "importFromXML" }) && !shouldImportForReference) continue

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
      const importedValue =
        direct === undefined
          ? hasRawEmptyXML && propertyRule.emptyAsRawXML === true
            ? propertyRule.defaultValueXMLEmpty
            : runWithConfigurationIndexPropertyContext(
                context,
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
          : runWithConfigurationIndexPropertyContext(
              context,
              propertyRule.yaml ?? key,
              configurationIndexUidSegment,
              (propertyContext) =>
                direct({
                  context: propertyContext,
                  rule: propertyRule,
                  xml: xmlValue,
                  name: itemName,
                  ownerXmlName,
                  traversal: { yamlPath: propertyYamlPath, rulePath: propertyRulePath, collector },
                }),
              { configurationIndexAddressing: propertyRule.configurationIndexAddressing }
            )
      const value =
        importedValue === undefined && hasExplicitXMLKeyWithEmptyDefault && direct === undefined
          ? propertyRule.defaultValueXMLEmpty
          : importedValue

      if (value !== undefined) {
        collectConfigurationIndexImportedValue({
          context,
          logicalAddress: propertyLogicalAddress,
          propertyKey: key,
          importedValue: value,
        })
      }

      const yamlValue =
        direct === undefined
          ? exportPropertyValueToYAML({
              context,
              rule: propertyRule,
              value,
              name: itemName,
              owner,
            })
          : value

      if (propertyRule.externalFile && propertyRule.toYAML !== false) {
        const parentName = context.exportToYAML?.parent?.name
        const externalFiles = context.exportToYAML?.externalFilesCollector
        const externalValue = direct === undefined ? value : yamlValue
        if (parentName !== undefined && externalFiles !== undefined && externalValue !== undefined) {
          const entry = buildExternalFileEntry(propertyRule.externalFile, parentName, externalValue as string)
          if (entry !== null) externalFiles.push(entry)
        }
        importedExternalProperties.add(key)
        continue
      }

      if (propertyRule.derivedFrom?.externalFile) {
        const referencedKey = propertyRule.derivedFrom.externalFile
        const derivedValue = direct === undefined ? value : yamlValue
        if (
          derivedValue === true ||
          (derivedValue === propertyRule.implicitValueYAML && !importedExternalProperties.has(referencedKey))
        ) {
          continue
        }
      }

      if (!canExportPropertyToYAML({ context, rule: propertyRule })) continue
      const exportedValues = getExportToYAMLResult(propertyRule, propertyRule.yaml!, yamlValue, value)
      if (exportedValues === undefined) continue
      Object.assign(result, exportedValues)
      collector.acceptProperty({ yamlPath: propertyYamlPath, rulePath: propertyRulePath, rule: propertyRule, value: yamlValue })
    } catch (cause) {
      throw new DirectImportConversionError(propertyYamlPath, propertyRulePath, cause)
    }
  }

  if (indexCollection !== undefined && importedKeysInSourceOrder.length > 0) {
    indexCollection.collector.setOrder(xmlNodeLogicalAddress!, importedKeysInSourceOrder)
  }

  return result
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

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
