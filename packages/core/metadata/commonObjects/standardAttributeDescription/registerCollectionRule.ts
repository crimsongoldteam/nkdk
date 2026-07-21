import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "../../context/types"
import { importMetadataItemCollectionFromXML } from "../../orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsRecord } from "../../orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { exportMetadataItemToXML } from "../../orchestration/metadataItem/toXML"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { isEmptyMetadataItem } from "../../orchestration/formElement/helper"
import type {
  ItemXML,
  PropertyRule,
  StandardAttributeDescriptionsPropertyRule,
} from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"
import type { StandardAttributeDescription } from "./types"

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

function filterNonEmpty(
  context: ConfigurationContext,
  rule: PropertyRule,
  items: readonly StandardAttributeDescription[] | undefined,
  preserveEmptyNames = new Set<string>()
): StandardAttributeDescription[] | undefined {
  if (!items) return undefined
  const canonicalNames = new Set(
    Object.keys((rule as StandardAttributeDescriptionsPropertyRule).standartAttributeNames ?? {})
  )
  const filtered = items.filter((item) => {
    if (canonicalNames.size === 0 || !canonicalNames.has(item.name as string)) return true
    if (typeof item.name === "string" && preserveEmptyNames.has(item.name)) return true
    return !isEmptyMetadataItem({
      context,
      rule: StandardAttributeDescriptionRules as any,
      element: item as any,
      ignoreKeys: ["name"],
    })
  })
  return filtered.length > 0 ? filtered : undefined
}

function importStandardAttributeDescriptionsFromYAML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: any
) {
  return importMetadataItemCollectionFromYAMLAsRecord({
    context,
    itemRule: StandardAttributeDescriptionRules,
    yaml: value,
    nameFromYAMLKey: buildNameFromYAML(rule),
  }) as StandardAttributeDescription[] | undefined
}

function buildNameFromYAML(rule: PropertyRule | undefined): (yamlKey: string) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  if (!names) return StandartAttributeNameFromYAML

  const reverse = new Map(Object.entries(names).map(([internalName, yamlName]) => [yamlName, internalName]))
  return (yamlKey) => reverse.get(yamlKey) ?? StandartAttributeNameFromYAML(yamlKey)
}

function buildNameToYAML(rule: PropertyRule | undefined): (item: StandardAttributeDescription) => string {
  const names = (rule as StandardAttributeDescriptionsPropertyRule | undefined)?.standartAttributeNames
  return (item) => names?.[item.name as string] ?? StandartAttributeNameToYAML[item.name as StandartAttributeName]
}

function importStandardAttributeDescriptionsFromXML(
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  xml: any
) {
  const importer = importMetadataItemCollectionFromXML(StandardAttributeDescriptionRules, "xr:StandardAttribute", {
    configurationIndexUidSegment: rule.configurationIndexUidSegment,
  })
  const xmlForImporter =
    xml && typeof xml === "object" && "xr:StandardAttribute" in xml ? xml : { "xr:StandardAttribute": xml }
  const raw = importer(context, rule, xmlForImporter) as StandardAttributeDescription[] | undefined
  const preserveEmptyNames = collectSelfClosingExtDimensionNames(xmlForImporter["xr:StandardAttribute"])

  const result = context.fromXML.forReference ? raw : filterNonEmpty(context, rule, raw, preserveEmptyNames)

  if (result && !context.fromXML.forReference) {
    const canonicalKeys = Object.keys((rule as StandardAttributeDescriptionsPropertyRule).standartAttributeNames ?? {})
    if (canonicalKeys.length > 0) {
      result.sort((a, b) => {
        const idxA = canonicalKeys.indexOf(a.name as string)
        const idxB = canonicalKeys.indexOf(b.name as string)
        return (idxA === -1 ? Infinity : idxA) - (idxB === -1 ? Infinity : idxB)
      })
    }
  }

  return result
}

const collectSelfClosingExtDimensionNames = (xml: unknown): Set<string> => {
  const result = new Set<string>()
  const xmlItems = Array.isArray(xml) ? xml : xml ? [xml] : []
  for (const item of xmlItems) {
    if (item === null || typeof item !== "object" || Array.isArray(item)) continue
    const entry = item as Record<string, unknown>
    const name = entry._name
    if (typeof name !== "string" || !/^ExtDimension(Type)?\d+$/.test(name)) continue
    if (Object.keys(entry).every((key) => key.startsWith("_"))) result.add(name)
  }
  return result
}

function exportStandardAttributeDescriptionsToXML(p: {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: any
  referenceMetadata?: any
  metadataItem?: any
}) {
  const items: StandardAttributeDescription[] = p.value ?? []
  const referenceItems: StandardAttributeDescription[] = Array.isArray(p.referenceMetadata) ? p.referenceMetadata : []

  const stdAttrRule = p.rule as StandardAttributeDescriptionsPropertyRule
  const standartAttributeNames: Record<string, string> =
    stdAttrRule.standartAttributeNamesXML?.(p.metadataItem) ?? stdAttrRule.standartAttributeNames ?? {}
  const canonicalNames = Object.keys(standartAttributeNames)
  const referenceNames = referenceItems.map((item) => item.name).filter((name): name is string => name !== undefined)
  const modelNames = items.map((item) => item.name).filter((name): name is string => name !== undefined)
  const modelNameSet = new Set(modelNames)
  const modelMatchesCanonical =
    canonicalNames.length > 0 &&
    modelNameSet.size === canonicalNames.length &&
    canonicalNames.every((name) => modelNameSet.has(name))

  // All-or-nothing: если ни один реквизит не изменён — секция не печатается
  const isGroupChanged = items.some(
    (item) =>
      !isEmptyMetadataItem({
        context: p.context,
        rule: StandardAttributeDescriptionRules as any,
        element: item as any,
        ignoreKeys: ["name"],
      })
  )

  if (!isGroupChanged && referenceNames.length === 0 && (modelNames.length === 0 || modelMatchesCanonical)) {
    return undefined
  }

  const names =
    referenceNames.length > 0
      ? Array.from(new Set([...referenceNames, ...modelNames]))
      : Array.from(new Set(!isGroupChanged ? modelNames : [...canonicalNames, ...modelNames]))
  const valueByName = new Map<string, StandardAttributeDescription>()
  for (const item of items) {
    if (item.name) valueByName.set(item.name as string, item)
  }
  const referenceByName = new Map<string, StandardAttributeDescription>()
  for (const item of referenceItems) {
    if (item.name) referenceByName.set(item.name as string, item)
  }

  const allItems = names.map((internalName) => {
    const modelItem = valueByName.get(internalName)
    const referenceData = referenceByName.get(internalName)
    if (!modelItem && referenceData) {
      const referenceRaw = getStandardAttributeReferenceRawXML(referenceData)
      if (referenceRaw) return referenceRaw
    }

    const item = modelItem ??
      referenceData ?? {
        itemType: "StandardAttributeDescription" as const,
        name: internalName as StandartAttributeName,
      }
    if (
      isEmptyMetadataItem({
        context: p.context,
        rule: StandardAttributeDescriptionRules as any,
        element: item as any,
        ignoreKeys: ["name"],
      })
    ) {
      const referenceData = referenceByName.get(internalName)
      if (referenceData) {
        const referenceRaw = getStandardAttributeReferenceRawXML(referenceData)
        if (referenceRaw) return referenceRaw
      }

      if (referenceNames.length === 0 && canonicalNames.includes(internalName) && !valueByName.has(internalName)) {
        return (
          exportMetadataItemToXML({
            context: p.context,
            data: { ...item, fillValue: undefined },
            rule: StandardAttributeDescriptionRules,
          }) ?? { _name: internalName }
        )
      }
      return { _name: internalName }
    }
    const itemWithFillValue = Object.prototype.hasOwnProperty.call(item, "fillValue")
      ? item
      : { ...item, fillValue: undefined }
    return (
      exportMetadataItemToXML({
        context: p.context,
        data: itemWithFillValue,
        referenceData: referenceByName.get(internalName),
        rule: StandardAttributeDescriptionRules,
      }) ?? { _name: internalName }
    )
  })

  return { "xr:StandardAttribute": allItems }
}

const getStandardAttributeReferenceRawXML = (referenceData: StandardAttributeDescription): ItemXML | undefined => {
  const raw = getReferenceRawXML(referenceData)
  if (!raw) return undefined

  return fillMissingReferenceDefaults({
    raw,
    referenceData,
    rule: StandardAttributeDescriptionRules,
  })
}

const getReferenceRawXML = (referenceData: unknown): ItemXML | undefined => {
  if (referenceData === null || referenceData === undefined || typeof referenceData !== "object") return undefined
  const value = (referenceData as Record<string, unknown>)[XML_REFERENCE_RAW]
  if (value === null || value === undefined || typeof value !== "object" || Array.isArray(value)) return undefined
  return sanitizeReferenceRawXML(value) as ItemXML
}

const sanitizeReferenceRawXML = (value: unknown): unknown => {
  if (value === undefined) return undefined
  if (Array.isArray(value)) return value.map(sanitizeReferenceRawXML)
  if (value === null || typeof value !== "object") return value

  const result: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (key === "#text" && typeof entry === "string" && entry.trim() === "") continue
    result[key] = sanitizeReferenceRawXML(entry)
  }
  return result
}

const fillMissingReferenceDefaults = (params: {
  raw: ItemXML
  referenceData: StandardAttributeDescription
  rule: typeof StandardAttributeDescriptionRules
}): ItemXML => {
  const result: ItemXML = { ...params.raw }

  for (const [propertyKey, propertyRule] of Object.entries(params.rule.properties)) {
    const xmlKey = propertyRule.xml ?? propertyKey
    if (!(xmlKey in result) || result[xmlKey] !== undefined || !("defaultValueXMLRaw" in propertyRule)) continue
    if (!Object.prototype.hasOwnProperty.call(params.referenceData, propertyKey)) continue
    result[xmlKey] = propertyRule.defaultValueXMLRaw
  }

  return result
}

function exportStandardAttributeDescriptionsToYAML(
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: StandardAttributeDescription[] | undefined
) {
  const data = value?.filter((item): item is StandardAttributeDescription & { name: string } => item.name !== undefined)

  return exportMetadataCollectionToYAMLAsRecord({
    context,
    data,
    itemRule: StandardAttributeDescriptionRules,
    keyField: "name",
    recordYamlKeyFromItem: buildNameToYAML(rule),
  })
}

registerMetadataItemCollectionRule({
  propertyType: "StandardAttributeDescriptions",
  itemRule: StandardAttributeDescriptionRules,
  xmlElement: "xr:StandardAttribute",
  keyField: "name",
  nameFromYAMLKey: StandartAttributeNameFromYAML,
  recordYamlKeyFromItem: (item) => StandartAttributeNameToYAML[item.name as StandartAttributeName],
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as StandartAttributeName],
  fromYAML: importStandardAttributeDescriptionsFromYAML,
  fromXML: importStandardAttributeDescriptionsFromXML,
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
  toYAML: exportStandardAttributeDescriptionsToYAML,
  toXML: exportStandardAttributeDescriptionsToXML,
})
