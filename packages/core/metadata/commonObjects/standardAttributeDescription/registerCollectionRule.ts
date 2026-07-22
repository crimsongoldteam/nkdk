import {
  ConfigurationContext,
  ConfigurationContextFromXML,
} from "../../context/types"
import { importMetadataItemCollectionFromXML } from "../../orchestration/metadataCollection/fromXML"
import { exportMetadataCollectionToYAMLAsRecord } from "../../orchestration/metadataCollection/toYAML"
import { registerMetadataItemCollectionRule } from "../../orchestration/metadataCollection/ruleFactory"
import { isEmptyMetadataItem } from "../../orchestration/formElement/helper"
import type { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "../../orchestration/property/types"
import { StandardAttributeDescriptionRules } from "./rules"
import { importStandardAttributeDescriptionsFromXMLToYAML } from "./fromXMLToYAML"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"
import type { StandardAttributeDescription } from "./types"

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
  nameFromYAMLKeyForProperty: ({ yamlKey, propertyRule }) => buildNameFromYAML(propertyRule)(yamlKey),
  completeItemNames: ({ source, propertyRule }) =>
    Object.keys(
      (propertyRule as StandardAttributeDescriptionsPropertyRule).standartAttributeNamesXML?.(source) ??
        (propertyRule as StandardAttributeDescriptionsPropertyRule).standartAttributeNames ??
        {}
    ),
  preserveReferenceItems: true,
  sparseItems: true,
  recordYamlKeyFromItem: (item) => StandartAttributeNameToYAML[item.name as StandartAttributeName],
  recordYamlKeyFromYAML: ({ name }) => StandartAttributeNameToYAML[name as StandartAttributeName],
  fromXML: importStandardAttributeDescriptionsFromXML,
  fromXMLToYAML: importStandardAttributeDescriptionsFromXMLToYAML,
  toYAML: exportStandardAttributeDescriptionsToYAML,
})
