import { registerTypeRule } from "../../../orchestration/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../../../orchestration/property/types"
import {
  getChildItemTypesByPropertyType,
  type ChildItemsTreePropertyType,
  childItemsTreePropertyTypes,
} from "../../commonObjects/childItems/treeYAML"
import { getElementRule, getElementXMLTagName } from "./ruleFactory"
import { CollectableElementTypeToYAML, type CollectableElementType } from "./types"
import {
  configurationIndexExportFormElementLogicalAddress,
  withConfigurationIndexExportLogicalAddress,
} from "../../../configurationIndex/referenceView"
import type { ConfigurationContextWithExportToXML } from "../../../context/types"
import { getChildContextToXML } from "../../../context/helpers"

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
      resolveItemContext: ({ context, name, itemRule }) => {
        const logicalAddress =
          name === undefined ? undefined : configurationIndexExportFormElementLogicalAddress(context, name)
        const indexedContext =
          logicalAddress === undefined ? context : withConfigurationIndexExportLogicalAddress(context, logicalAddress)
        return name === undefined
          ? indexedContext
          : getChildContextToXML({
              context: indexedContext,
              itemType: itemRule.itemType,
              path: `${itemRule.itemType}.${name}`,
              name,
            })
      },
      mapItemOutput: ({ xml, itemRule, context, name }) => ({
        [getElementXMLTagName(itemRule.itemType as CollectableElementType)]: withNameAndId(xml, name, context),
      }),
      unwrapReferenceItem: ({ xml, itemRule }) => {
        const value = xml[getElementXMLTagName(itemRule.itemType as CollectableElementType)]
        return value !== null && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : undefined
      },
      yamlShape: "record",
    })
  }
}

function withNameAndId(
  xml: Record<string, unknown>,
  name: string | undefined,
  context: ConfigurationContextWithExportToXML
): Record<string, unknown> {
  const { _name, _id, ...properties } = xml
  const runtime = context.exportToXML.configurationIndex
  const indexedId = runtime?.identity("xmlId")
  if (indexedId !== undefined) runtime?.collector.setXmlId(runtime.logicalAddress, indexedId)
  return {
    _name: typeof _name === "string" ? _name : name,
    _id: typeof _id === "string" && _id.length > 0 ? _id : (indexedId ?? ""),
    ...properties,
  }
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
