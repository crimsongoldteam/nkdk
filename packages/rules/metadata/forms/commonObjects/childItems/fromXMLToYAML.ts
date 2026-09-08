import {
  getConfigurationIndexCollectionContext,
  getConfigurationIndexFormElementLogicalAddress,
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
import { getTypeRule } from "../../../ruleRuntime/property/typeRuleRegistry"
import type {
  CollectableElementType,
  ElementRule,
  ElementType,
} from "../../../ruleRuntime/formElement/types"
import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { createMetadataCollectionFrame } from "@nkdk/runtime/rule-kit"
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

export const resolveItemTypeFromXMLTag = (rule: PropertyRule, xmlTag: string, xmlValue: XmlElementNode): string => {
  if (rule.type === "CommandBarChildItems" && xmlTag === "Button") {
    let type: unknown
    const types = xmlElementChildren(xmlValue, "Type")
    if (types.length === 1 && types[0]!.attributes.length === 0 && types[0]!.content.every(node => node.type === "text")) {
      type = xmlTextValue(types[0]!)
    }
    return type === "CommandBarButton" || type === "CommandBarHyperlink" ? "CommandBarButton" : "Button"
  }
  if (rule.type !== "TableChildItems") return xmlTag
  return tableXMLTagToItemType[xmlTag] ?? xmlTag
}

export const importChildItemsFromXMLToYAML: ImportFromXMLToYAMLFunction = ({ context, rule, xml, traversal }) => {
  if (xml === undefined && traversal.xmlNodes === undefined) return undefined
  const roots = traversal.xmlNodes ?? (isXmlElementNode(xml) ? [xml] : undefined)
  if (roots === undefined) throw new Error("Для импорта элементов формы нужен структурный XML-узел")
  const result: Record<string, unknown> = {}
  const descriptor = getTypeRule(rule.type, "yamlToXMLNestedRule")
  if (descriptor?.kind !== "collection" || descriptor.resolveXMLItemRule === undefined) {
    throw new Error(`Для коллекции ${rule.type} не определены XML-маршруты`)
  }
  const collection = getConfigurationIndexCollectionContext(context)
  const parentItemType = traversal.rulePath.findLast(segment => segment.nestedItemType !== undefined)?.nestedItemType
  const contextMenuItems = rule.type === "CommandBarChildItems" && parentItemType === "ContextMenu"
  const path = traversal.pathCursor
  const frame = createMetadataCollectionFrame({
    descriptor, propertyRule: rule, path,
    prepareContext(item) {
      const logicalAddress = collection === undefined || item.name === undefined
        ? undefined : getConfigurationIndexFormElementLogicalAddress(collection, item.name)
      if (logicalAddress === undefined) return context
      if (item.source.kind !== "xml" || !isXmlElementNode(item.source.value)) throw new Error("Ожидался XML-элемент формы")
      const id = xmlAttributeValue(item.source.value, "id")
      if (id !== undefined) collection?.collector.setIdentity(logicalAddress, "xmlId", id)
      return withConfigurationIndexLogicalAddress(context, logicalAddress)
    },
  })

  frame.visit(childElements(roots), node => ({
    kind: "xml", value: node, name: xmlAttributeValue(node, "name"), occurrence: formChildItemOccurrence(node),
  }), (item, itemXmlNode) => {
    const itemRule = item.rule as ElementRule & { itemType: CollectableElementType }
    const itemType = itemRule.itemType
    const itemName = item.name
    if (typeof itemName !== "string" || itemName.length === 0) {
      throw new Error("У элемента формы отсутствует name")
    }
    const occurrence = item.occurrence
    const misplacedPicture = contextMenuItems && itemType === "PictureField"
    if (occurrence > 0 || misplacedPicture) {
      if (traversal.mode === "facts") return
      const node = itemXmlNode
      if (traversal.annotations === undefined) {
        throw new Error("Для сохранения аномального элемента формы нужны XML-узел и таблица аннотаций")
      }
      const key = appendXmlAnnotatedMappingEntry(result, traversal.annotations, {
        logicalKey: itemName,
        value: undefined,
        ...(occurrence === 0 ? {} : { keyAnnotation: { kind: "invalid" as const, occurrence } }),
        valueAnnotation: { kind: "raw", occurrence: 1, xml: encodeXmlRawElement(node, ""), hasSemanticValue: false },
      })
      const boundary = { itemType, yamlPath: path.child(key).toArray(), rulePath: traversal.rulePath }
      traversal.audit?.claim(node, boundary)
      traversal.audit?.claimStructuralSubtree(node, boundary)
      return
    }
    result[itemName] = importFormElementFromXMLToYAML({
      context: item.context,
      rule: itemRule,
      xml: itemXmlNode,
      name: itemName,
      traversal: {
        ...traversal,
        ...(traversal.mode === "facts" ? { produceResult: false } : {}),
        pathCursor: item.path,
        xmlNodes: [itemXmlNode],
      },
    })
  })

  return Object.keys(result).length === 0 ? undefined : result
}

function* childElements(roots: readonly XmlElementNode[]): Iterable<XmlElementNode> {
  for (const root of roots) {
    for (const node of root.content) if (node.type === "element") yield node
  }
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
