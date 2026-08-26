import { getTypeRule } from "../property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../property/types"
import {
  configurationIndexExportFormElementLogicalAddress,
  withConfigurationIndexExportLogicalAddress,
} from "../../configurationIndex/referenceView"
import type { ConfigurationContextWithExportToXML } from "../../context/types"
import { getChildContextToXML } from "../../context/childContext"
import { copyYAMLRuntimeMetadata } from "../../../yaml/runtimeMetadata"
import type { YAMLToXMLNestedRule } from "../property/fromYAMLToXMLTypes"
import { registerFormXmlIdReservation } from "../../configurationIndex/formXmlIdReservation"
import { resolveFormElementXMLId } from "./xmlIdentity"

type FormElementCollectionNestedRule = Extract<YAMLToXMLNestedRule, { kind: "collection" }>

export function createFormElementCollectionNestedRule(params: {
  readonly elementRules: Readonly<Record<string, MetadataItemRule>>
  readonly elementKinds: Readonly<Record<string, string>>
  readonly allowedTypes: readonly string[]
}): FormElementCollectionNestedRule {
  const fallbackRule = requireDefinedElementRule(params, params.allowedTypes[0])
  const resolve = (yaml: unknown, name: string | undefined) => {
    const node = asNode(yaml, name)
    const kind = node.Вид
    if (typeof kind !== "string") throw new Error(`Элемент "${name ?? ""}": обязательное поле "Вид" не задано`)
    const itemType = params.allowedTypes.find((candidate) => params.elementKinds[candidate] === kind)
    if (itemType === undefined) throw new Error(`Элемент "${name ?? ""}": неизвестный Вид "${kind}"`)
    return requireDefinedElementRule(params, itemType)
  }
  return {
    kind: "collection",
    itemRule: fallbackRule,
    requiredIdentity: "xmlId",
    resolveItemRule: ({ yaml, name }) => resolve(yaml, name),
    normalizeItemYAML: ({ yaml, name }) => normalizeDefinedFormElementYAML(yaml, name, resolve(yaml, name)),
    resolveItemContext: ({ context, name, itemRule }) => {
      const logicalAddress = name === undefined ? undefined : configurationIndexExportFormElementLogicalAddress(context, name)
      const indexedContext = logicalAddress === undefined ? context : withConfigurationIndexExportLogicalAddress(context, logicalAddress)
      return name === undefined ? indexedContext : getChildContextToXML({
        context: indexedContext,
        itemType: itemRule.itemType,
        path: `${itemRule.itemType}.${name}`,
        name,
      })
    },
    mapItemOutput: ({ xml, itemRule, context, name }) => ({
      [elementXMLTagName(itemRule)]: withNameAndId(xml, name, context),
    }),
    unwrapReferenceItem: ({ xml, itemRule }) => {
      const value = xml[elementXMLTagName(itemRule)]
      return value !== null && typeof value === "object" && !Array.isArray(value)
        ? value as Record<string, unknown>
        : undefined
    },
    yamlShape: "record",
  }
}

function requireDefinedElementRule(
  params: { readonly elementRules: Readonly<Record<string, MetadataItemRule>> },
  itemType: string | undefined,
): MetadataItemRule {
  const rule = itemType === undefined ? undefined : params.elementRules[itemType]
  if (rule === undefined) throw new Error(`Unknown element type: ${itemType ?? ""}`)
  return rule
}

function elementXMLTagName(rule: MetadataItemRule): string {
  return "xmlTag" in rule && typeof rule.xmlTag === "string" ? rule.xmlTag : rule.itemType
}

function normalizeDefinedFormElementYAML(
  value: unknown,
  name: string | undefined,
  rule: MetadataItemRule,
): Record<string, unknown> {
  const node = asNode(value, name)
  const { Вид: _kind, Тип: _legacyKind, ТипКнопки: buttonType, ...yaml } = node
  const result = rule.itemType === "Button" || rule.itemType === "CommandBarButton"
    ? { ...yaml, ...(buttonType === undefined ? {} : { Вид: buttonType }) }
    : yaml
  copyYAMLRuntimeMetadata(node, result)
  return result
}

function withNameAndId(
  xml: Record<string, unknown>,
  name: string | undefined,
  context: ConfigurationContextWithExportToXML
): Record<string, unknown> {
  const { _name, _id, ...properties } = xml
  const runtime = context.exportToXML.configurationIndex
  const indexedId = resolveFormElementXMLId(context)
  const result = {
    _name: typeof _name === "string" ? _name : name,
    _id: typeof _id === "string" && _id.length > 0 ? _id : (indexedId ?? ""),
    ...properties,
  }
  registerFormXmlIdReservation(result, {
    ...(runtime === undefined ? {} : { runtime }),
    space: "elements",
  })
  return result
}

export function resolveFormElementRule(params: {
  yaml: unknown
  name: string | undefined
  propertyRule: PropertyRule
}): MetadataItemRule {
  const nestedRule = getTypeRule(
    params.propertyRule.type,
    "yamlToXMLNestedRule",
  )
  if (nestedRule?.kind !== "collection" || nestedRule.resolveItemRule === undefined) {
    throw new Error(
      `Для свойства ${params.propertyRule.type} не задано правило коллекции элементов формы`,
    )
  }
  return nestedRule.resolveItemRule({
    yaml: params.yaml,
    name: params.name,
    index: 0,
    propertyRule: params.propertyRule,
  })
}

export function normalizeFormElementYAML(params: {
  yaml: unknown
  name: string | undefined
  propertyRule: PropertyRule
}): Record<string, unknown> {
  const node = asNode(params.yaml, params.name)
  const itemType = resolveFormElementRule(params).itemType
  const { Вид: _kind, Тип: _legacyKind, ТипКнопки: buttonType, ...yaml } = node
  const result = itemType === "Button" || itemType === "CommandBarButton"
    ? { ...yaml, ...(buttonType === undefined ? {} : { Вид: buttonType }) }
    : yaml
  copyYAMLRuntimeMetadata(node, result)
  return result
}

function asNode(value: unknown, name: string | undefined): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Элемент "${name ?? ""}": должен быть объектом`)
  }
  return value as Record<string, unknown>
}
