import { LineCounter, YAMLMap } from "yaml"
import {
  ConfigurationContext,
  ConfigurationContextFromXML,
  ConfigurationContextWithExportToXML,
} from "~/metadata/context/types"
import { GraphOps, GraphOpsChild } from "~/metadata/orchestration/property/fn"
import { importMetadataItemCollectionFromXML } from "~/metadata/orchestration/metadataCollection/fromXML"
import { importMetadataItemCollectionFromYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/fromYAML"
import { exportMetadataCollectionToYAMLAsRecord } from "~/metadata/orchestration/metadataCollection/toYAML"
import { exportMetadataItemToXML } from "~/metadata/orchestration/metadataItem/toXML"
import { registerMetadataItemCollectionRule } from "~/metadata/orchestration/metadataCollection/ruleFactory"
import { isEmptyMetadataItem } from "~/metadata/orchestration/formElement/helper"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { PropertyRule, StandardAttributeDescriptionsPropertyRule } from "~/metadata/orchestration/property/types"
import { computeKeyPosition, findSubmap } from "~/metadata/orchestration/property/position"
import { StandardAttributeDescriptionRules } from "./rules"
import {
  StandartAttributeNameFromYAML,
  StandartAttributeNameToYAML,
  type StandartAttributeName,
} from "./standartAttributeNames"
import type { StandardAttributeDescription } from "./types"

const NODE_SEGMENT = "СтандартныйРеквизит"
const EDGE_KIND = "STANDARD_ATTRIBUTE"
const EDGE_YAML = "СтандартныйРеквизит"

function filterNonEmpty(
  context: ConfigurationContext,
  rule: PropertyRule,
  items: readonly StandardAttributeDescription[] | undefined
): StandardAttributeDescription[] | undefined {
  if (!items) return undefined
  const canonicalNames = new Set(
    Object.keys((rule as StandardAttributeDescriptionsPropertyRule).standartAttributeNames ?? {})
  )
  const filtered = items.filter((item) => {
    if (canonicalNames.size === 0 || !canonicalNames.has(item.name as string)) return true
    return !isEmptyMetadataItem({
      context,
      rule: StandardAttributeDescriptionRules as any,
      element: item as any,
      ignoreKeys: ["name"],
    })
  })
  return filtered.length > 0 ? filtered : undefined
}

function buildStandardAttributesGraph(params: {
  model: unknown
  parentNodeId: string
  filePath: string
  yamlMap: YAMLMap | undefined
  lineCounter: LineCounter | undefined
  propRule: PropertyRule
}): GraphOps | undefined {
  const { model, parentNodeId, yamlMap, lineCounter, propRule } = params
  const stdAttrRule = propRule as StandardAttributeDescriptionsPropertyRule
  if (!stdAttrRule.standartAttributeNames) return undefined

  const stdAttrsYamlMap = propRule.yaml ? findSubmap(yamlMap, propRule.yaml) : undefined
  const result = model as readonly StandardAttributeDescription[] | undefined

  // Build map of explicitly defined items (russianName → item)
  const explicitItems = new Map<string, StandardAttributeDescription>()
  const nameToYAML = buildNameToYAML(propRule)
  if (result) {
    for (const item of result) {
      const russianName = nameToYAML(item)
      if (russianName) explicitItems.set(russianName, item)
    }
  }

  const children: GraphOpsChild[] = []
  for (const [index, [internalName, russianName]] of Object.entries(stdAttrRule.standartAttributeNames).entries()) {
    const absoluteId = `${parentNodeId}.${NODE_SEGMENT}.${russianName}`

    // US 13: standard attributes always have item so they are never treated as stubs
    const item = explicitItems.get(russianName) ?? {
      itemType: "StandardAttributeDescription" as const,
      name: internalName,
    }
    children.push({
      idSuffix: russianName,
      absoluteId,
      name: russianName,
      positionFrom:
        stdAttrsYamlMap && lineCounter ? computeKeyPosition(stdAttrsYamlMap, russianName, lineCounter) : undefined,
      index,
      item: item as unknown as Record<string, unknown>,
    })
  }

  if (children.length === 0) return undefined
  return { children, edgeKind: EDGE_KIND, edgeYaml: EDGE_YAML }
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
  const importer = importMetadataItemCollectionFromXML(StandardAttributeDescriptionRules, "xr:StandardAttribute")
  const xmlForImporter =
    xml && typeof xml === "object" && "xr:StandardAttribute" in xml ? xml : { "xr:StandardAttribute": xml }
  const raw = importer(context, rule, xmlForImporter) as StandardAttributeDescription[] | undefined

  const result = context.fromXML.forReference ? raw : filterNonEmpty(context, rule, raw)

  if (result) {
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

  if (!isGroupChanged && referenceNames.length === 0 && !(canonicalNames.length === 0 && modelNames.length > 0)) {
    return undefined
  }

  const names = Array.from(
    new Set(referenceNames.length > 0 ? [...referenceNames, ...modelNames] : [...canonicalNames, ...modelNames])
  )
  const valueByName = new Map<string, StandardAttributeDescription>()
  for (const item of items) {
    if (item.name) valueByName.set(item.name as string, item)
  }
  const referenceByName = new Map<string, StandardAttributeDescription>()
  for (const item of referenceItems) {
    if (item.name) referenceByName.set(item.name as string, item)
  }

  const allItems = names.map((internalName) => {
    const item = valueByName.get(internalName) ??
      referenceByName.get(internalName) ?? {
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
      if (referenceNames.length === 0 && canonicalNames.includes(internalName) && !valueByName.has(internalName)) {
        return (
          exportMetadataItemToXML({
            context: p.context,
            data: { ...item, fillValue: undefined },
            referenceData: referenceByName.get(internalName),
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
  fromYAML: importStandardAttributeDescriptionsFromYAML,
  fromXML: importStandardAttributeDescriptionsFromXML,
  toYAML: exportStandardAttributeDescriptionsToYAML,
  toXML: exportStandardAttributeDescriptionsToXML,
})

registerTypeRule("StandardAttributeDescriptions", "buildGraphFromModel", buildStandardAttributesGraph)
