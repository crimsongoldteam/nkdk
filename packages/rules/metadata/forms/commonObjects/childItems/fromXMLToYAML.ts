import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  objectRecordOrUndefined,
  withConfigurationIndexLogicalAddress,
  xmlElementChildren,
} from "@nkdk/runtime"
import { getElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type {
  CollectableElementType,
  ElementRule,
  ElementType,
  ElementXML,
} from "../../../ruleRuntime/formElement/types"
import { CollectableElementTypeToYAML } from "../../elements/ruleRuntime/types"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { importFormElementPropertiesFromXMLToYAML } from "../../elements/ruleRuntime/fromXMLToYAML"
import { childItemsTreePropertyTypes, moveButtonTypeToTreeYAML } from "./treeYAML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import type { TableChildItem } from "./types"
import { copyYAMLRuntimeMetadata } from "@nkdk/runtime"

const resolveItemTypeFromXMLTag = (rule: PropertyRule, xmlTag: string, xmlValue?: Record<string, unknown>): string => {
  if (rule.type === "CommandBarChildItems" && xmlTag === "Button") {
    const type = xmlValue?.Type
    return type === "CommandBarButton" || type === "CommandBarHyperlink" ? "CommandBarButton" : "Button"
  }
  if (rule.type !== "TableChildItems") return xmlTag
  const tableXMLTagToItemType: Record<string, TableChildItem["itemType"]> = {
    CheckBoxField: "TableCheckBoxField",
    ColumnGroup: "ColumnGroup",
    InputField: "TableInputField",
    LabelField: "TableLabelField",
    PictureField: "TablePictureField",
  }
  return tableXMLTagToItemType[xmlTag] ?? xmlTag
}

export const importChildItemsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, rule, xml, traversal }) => {
  if (xml === undefined) return undefined
  const itemXmlNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node))
  const items = itemXmlNodes === undefined
    ? Array.isArray(xml) ? xml : [xml]
    : itemXmlNodes.map((node) => ({ [node.name]: node.compatibilityValue }))
  const result: Record<string, unknown> = {}

  for (const [index, value] of items.entries()) {
    const item = objectRecordOrUndefined(value)
    const xmlTag = item === undefined ? undefined : Object.keys(item)[0]
    if (item === undefined || xmlTag === undefined) continue
    const rawXml = objectRecordOrUndefined(item[xmlTag])
    if (rawXml === undefined) continue
    const itemType = resolveItemTypeFromXMLTag(rule, xmlTag, rawXml) as CollectableElementType
    const xmlValue = (objectRecordOrUndefined(item[itemType]) ?? rawXml) as ElementXML
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
      collection?.collector.setIdentity(logicalAddress, "xmlId", xmlValue._id)
    }

    const properties = importFormElementPropertiesFromXMLToYAML({
      context: itemContext,
      rule: getElementRule(itemType) as ElementRule & { itemType: CollectableElementType },
      xml: xmlValue,
      name: itemName,
      traversal: {
        ...traversal,
        yamlPath: [...traversal.yamlPath, itemName],
        ...(itemXmlNodes?.[index] === undefined ? {} : { xmlNodes: [itemXmlNodes[index]!] }),
      },
    })
    const treeProperties = moveButtonTypeToTreeYAML({ itemType, yaml: properties })
    const treeItem = {
      Вид: currentRuleRegistrySet<{ formElementKinds: ReadonlyMap<string, string> }>()
        ?.formElementKinds.get(itemType) ?? CollectableElementTypeToYAML[itemType],
      ...treeProperties,
    }
    copyYAMLRuntimeMetadata(treeProperties, treeItem)
    result[itemName] = treeItem
  }

  return Object.keys(result).length === 0 ? undefined : result
}

export const metadataRuleLayer000 = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: propertyTypesFromContributions(
    childItemsTreePropertyTypes.flatMap((propertyType) => [
      definePropertyTypeRule(
        propertyType,
        "importFromXMLToYAML",
        importChildItemsFromXMLToYAML,
      ),
      definePropertyTypeRule(propertyType, "nestedItemRule", {
        resolveItemRule(itemType) {
          return getElementRule(itemType as ElementType)
        },
      }),
    ]),
  ),
})
