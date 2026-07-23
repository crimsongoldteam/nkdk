import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../../../orchestration/property/types"
import {
  getChildItemTypesByPropertyType,
  type ChildItemsTreePropertyType,
  childItemsTreePropertyTypes,
} from "../../commonObjects/childItems/treeYAML"
import { getElementRule, getElementXMLTagName } from "./ruleFactory"
import { CollectableElementTypeToYAML, type CollectableElementType } from "./types"

export function registerDirectFormElementCollections(): void {
  for (const propertyType of childItemsTreePropertyTypes) {
    const fallbackRule = getElementRule(getChildItemTypesByPropertyType(propertyType)[0])
    registerTypeRule(propertyType, "yamlToXMLNestedRule", {
      kind: "collection",
      itemRule: fallbackRule,
      resolveItemRule: ({ yaml, name, propertyRule }) =>
        resolveFormElementRule({ yaml, name, propertyRule: propertyRule ?? { type: propertyType } }),
      normalizeItemYAML: ({ yaml, name, propertyRule }) =>
        normalizeFormElementYAML({ yaml, name, propertyRule: propertyRule ?? { type: propertyType } }),
      mapItemOutput: ({ xml, itemRule }) => ({
        [getElementXMLTagName(itemRule.itemType as CollectableElementType)]: withNameAndId(xml),
      }),
      unwrapReferenceItem: ({ xml, itemRule }) => {
        const value = xml[getElementXMLTagName(itemRule.itemType as CollectableElementType)]
        return value !== null && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : undefined
      },
      yamlShape: "record",
      configurationIndexAddressing: "yamlPath",
    })
  }
}

function withNameAndId(xml: Record<string, unknown>): Record<string, unknown> {
  const { _name, _id, ...properties } = xml
  return { _name, _id: typeof _id === "string" ? _id : "", ...properties }
}

export function resolveFormElementRule(params: {
  yaml: unknown
  name: string | undefined
  propertyRule: PropertyRule
}): MetadataItemRule {
  const node = asNode(params.yaml, params.name)
  const kind = node.Вид
  if (typeof kind !== "string") throw new Error(`Элемент "${params.name ?? ""}": обязательное поле "Вид" не задано`)
  const propertyType = isChildItemsTreePropertyType(params.propertyRule.type)
    ? params.propertyRule.type
    : "GroupChildItems"
  const allowedTypes = getChildItemTypesByPropertyType(propertyType)
  const itemType = allowedTypes.find((candidate) => CollectableElementTypeToYAML[candidate] === kind)
  if (itemType === undefined) throw new Error(`Элемент "${params.name ?? ""}": неизвестный Вид "${kind}"`)
  return getElementRule(itemType)
}

export function normalizeFormElementYAML(params: {
  yaml: unknown
  name: string | undefined
  propertyRule: PropertyRule
}): Record<string, unknown> {
  const node = asNode(params.yaml, params.name)
  const itemType = resolveFormElementRule(params).itemType
  const { Вид: _kind, Тип: _legacyKind, ТипКнопки: buttonType, ...yaml } = node
  return itemType === "Button" || itemType === "CommandBarButton"
    ? { ...yaml, ...(buttonType === undefined ? {} : { Вид: buttonType }) }
    : yaml
}

function asNode(value: unknown, name: string | undefined): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Элемент "${name ?? ""}": должен быть объектом`)
  }
  return value as Record<string, unknown>
}

function isChildItemsTreePropertyType(value: string): value is ChildItemsTreePropertyType {
  return childItemsTreePropertyTypes.some((propertyType) => propertyType === value)
}
