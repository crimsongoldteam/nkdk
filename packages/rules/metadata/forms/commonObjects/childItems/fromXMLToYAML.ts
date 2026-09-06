import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
  objectRecordOrUndefined,
  isXmlElementNode,
  xmlAttributeValue,
  xmlTextValue,
  type XmlElementNode,
  withConfigurationIndexLogicalAddress,
  xmlElementChildren,
  appendXmlAnnotatedMappingEntry,
  encodeXmlRawElement,
} from "@nkdk/runtime"
import { getElementRule } from "../../../ruleRuntime/formElement/ruleFactory"
import type {
  CollectableElementType,
  ElementRule,
  ElementType,
  ElementXML,
} from "../../../ruleRuntime/formElement/types"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import {
  definePropertyTypeRule,
  propertyTypesFromContributions,
} from "../../../ruleRuntime/property/propertyRuleRegistrySet"
import { defineMetadataRules } from "../../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../../ruleRuntime/definition/testSupport"
import { importFormElementFromXMLToYAML } from "../../elements/ruleRuntime/fromXMLToYAML"
import { childItemsTreePropertyTypes } from "./treeYAML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import type { TableChildItem } from "./types"
import { formChildItemOccurrence } from "./xmlOccurrences"

const tableXMLTagToItemType: Readonly<Record<string, TableChildItem["itemType"]>> = {
  CheckBoxField: "TableCheckBoxField",
  ColumnGroup: "ColumnGroup",
  InputField: "TableInputField",
  LabelField: "TableLabelField",
  PictureField: "TablePictureField",
}

const resolveItemTypeFromXMLTag = (rule: PropertyRule, xmlTag: string, xmlValue?: Record<string, unknown> | XmlElementNode): string => {
  if (rule.type === "CommandBarChildItems" && xmlTag === "Button") {
    let type: unknown
    if (isXmlElementNode(xmlValue)) {
      const types = xmlElementChildren(xmlValue, "Type")
      if (types.length === 1 && types[0]!.attributes.length === 0 && types[0]!.content.every(node => node.type === "text")) {
        type = xmlTextValue(types[0]!)
      }
    } else type = xmlValue?.Type
    return type === "CommandBarButton" || type === "CommandBarHyperlink" ? "CommandBarButton" : "Button"
  }
  if (rule.type !== "TableChildItems") return xmlTag
  return tableXMLTagToItemType[xmlTag] ?? xmlTag
}

export const importChildItemsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, rule, xml, traversal }) => {
  if (xml === undefined && traversal.xmlNodes === undefined) return undefined
  const itemXmlNodes = traversal.xmlNodes?.flatMap((node) => xmlElementChildren(node))
  const items = itemXmlNodes === undefined
    ? Array.isArray(xml) ? xml : [xml]
    : itemXmlNodes
  const result: Record<string, unknown> = {}
  const occurrences = new Map<string, number>()
  const routes = new Map<CollectableElementType, ElementRule & { itemType: CollectableElementType }>()
  const collection = getConfigurationIndexCollectionContext(context)
  const parentItemType = traversal.rulePath.findLast(segment => segment.nestedItemType !== undefined)?.nestedItemType
  const contextMenuItems = rule.type === "CommandBarChildItems" && parentItemType === "ContextMenu"

  for (const value of items) {
    const itemXmlNode = isXmlElementNode(value) ? value : undefined
    const item = itemXmlNode === undefined ? objectRecordOrUndefined(value) : undefined
    const xmlTag = itemXmlNode?.name ?? (item === undefined ? undefined : Object.keys(item)[0])
    if (xmlTag === undefined) continue
    const rawXml = objectRecordOrUndefined(item?.[xmlTag])
    if (itemXmlNode === undefined && rawXml === undefined) continue
    const itemType = resolveItemTypeFromXMLTag(rule, xmlTag, itemXmlNode ?? rawXml) as CollectableElementType
    const recordValue = (objectRecordOrUndefined(item?.[itemType]) ?? rawXml) as ElementXML | undefined
    const xmlValue = itemXmlNode ?? recordValue
    if (xmlValue === undefined) continue
    const itemName = itemXmlNode === undefined ? recordValue?._name : xmlAttributeValue(itemXmlNode, "name")
    if (typeof itemName !== "string" || itemName.length === 0) {
      throw new Error("У элемента формы отсутствует name")
    }
    const occurrence = formChildItemOccurrence(itemXmlNode) ?? occurrences.get(itemName) ?? 0
    occurrences.set(itemName, occurrence + 1)
    const misplacedPicture = contextMenuItems && itemType === "PictureField"
    if (occurrence > 0 || misplacedPicture) {
      if (traversal.mode === "facts") continue
      const node = itemXmlNode
      if (node === undefined || traversal.annotations === undefined) {
        throw new Error("Для сохранения аномального элемента формы нужны XML-узел и таблица аннотаций")
      }
      const key = appendXmlAnnotatedMappingEntry(result, traversal.annotations, {
        logicalKey: itemName,
        value: undefined,
        ...(occurrence === 0 ? {} : { keyAnnotation: { kind: "invalid" as const, occurrence } }),
        valueAnnotation: { kind: "raw", occurrence: 1, xml: encodeXmlRawElement(node, ""), hasSemanticValue: false },
      })
      const boundary = { itemType, yamlPath: [...traversal.yamlPath, key], rulePath: traversal.rulePath }
      traversal.audit?.claim(node, boundary)
      traversal.audit?.claimStructuralSubtree(node, boundary)
      continue
    }
    const logicalAddress =
      collection === undefined ? undefined : getConfigurationIndexFormElementLogicalAddress(collection, itemName)
    const itemContext =
      logicalAddress === undefined ? context : withConfigurationIndexLogicalAddress(context, logicalAddress)
    const id = itemXmlNode === undefined ? recordValue?._id : xmlAttributeValue(itemXmlNode, "id")
    if (logicalAddress !== undefined && typeof id === "string") {
      collection?.collector.setIdentity(logicalAddress, "xmlId", id)
    }

    let itemRule = routes.get(itemType)
    if (itemRule === undefined) {
      itemRule = getElementRule(itemType) as ElementRule & { itemType: CollectableElementType }
      routes.set(itemType, itemRule)
    }
    result[itemName] = importFormElementFromXMLToYAML({
      context: itemContext,
      rule: itemRule,
      xml: xmlValue,
      name: itemName,
      traversal: {
        ...traversal,
        ...(traversal.mode === "facts" ? { produceResult: false } : {}),
        yamlPath: [...traversal.yamlPath, itemName],
        ...(itemXmlNode === undefined ? {} : { xmlNodes: [itemXmlNode] }),
      },
    })
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
