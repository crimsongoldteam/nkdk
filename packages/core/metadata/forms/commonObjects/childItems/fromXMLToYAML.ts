import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  withConfigurationIndexLogicalAddress,
} from "../../../configurationIndex/collector/context"
import { getElementRule } from "../../../orchestration/formElement/ruleFactory"
import type {
  CollectableElementType,
  ElementRule,
  ElementType,
  ElementXML,
} from "../../../orchestration/formElement/types"
import { CollectableElementTypeToYAML } from "../../elements/orchestration/types"
import type { ImportFromXMLToYAMLFunction } from "../../../orchestration/property/importYamlTypes"
import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import { importFormElementPropertiesFromXMLToYAML } from "../../elements/orchestration/fromXMLToYAML"
import { resolveItemTypeFromXMLTag } from "./fromXML"
import { childItemsTreePropertyTypes, moveButtonTypeToTreeYAML } from "./treeYAML"

export const importChildItemsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  rule,
  xml,
  traversal,
}) => {
  if (xml === undefined) return undefined
  const items = Array.isArray(xml) ? xml : [xml]
  const result: Record<string, unknown> = {}

  for (const value of items) {
    const item = asRecord(value)
    const xmlTag = item === undefined ? undefined : Object.keys(item)[0]
    if (item === undefined || xmlTag === undefined) continue
    const rawXml = asRecord(item[xmlTag])
    if (rawXml === undefined) continue
    const itemType = resolveItemTypeFromXMLTag(rule, xmlTag, rawXml) as CollectableElementType
    const xmlValue = (asRecord(item[itemType]) ?? rawXml) as ElementXML
    if (typeof xmlValue._name !== "string" || xmlValue._name.length === 0) {
      throw new Error("У элемента формы отсутствует name")
    }
    const itemName = xmlValue._name
    const collection = getConfigurationIndexCollectionContext(context)
    const logicalAddress =
      collection === undefined ? undefined : getConfigurationIndexFormElementLogicalAddress(collection, itemName)
    const itemContext =
      logicalAddress === undefined ? context : withConfigurationIndexLogicalAddress(context, logicalAddress)
    if (logicalAddress !== undefined && typeof xmlValue._id === "string") {
      collection?.collector.setXmlId(logicalAddress, xmlValue._id)
    }

    const properties = importFormElementPropertiesFromXMLToYAML({
      context: itemContext,
      rule: getElementRule(itemType) as ElementRule & { itemType: CollectableElementType },
      xml: xmlValue,
      name: itemName,
      traversal: {
        ...traversal,
        yamlPath: [...traversal.yamlPath, itemName],
      },
    })
    result[itemName] = {
      Вид: CollectableElementTypeToYAML[itemType],
      ...moveButtonTypeToTreeYAML({ itemType, yaml: properties }),
    }
  }

  return Object.keys(result).length === 0 ? undefined : result
}

for (const propertyType of childItemsTreePropertyTypes) {
  registerTypeRule(propertyType, "importFromXMLToYAML", importChildItemsFromXMLToYAML)
  registerTypeRule(propertyType, "nestedItemRule", {
    resolveItemRule(itemType) {
      return getElementRule(itemType as ElementType)
    },
  })
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}
