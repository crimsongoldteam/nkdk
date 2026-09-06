import { importNumberFromXML } from "../number/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { getTypePrefix, removeTypePrefix } from "./helper"
import {
  TYPE_DESCRIPTION_SOURCE_TYPES,
  TypeDescription,
  TypeDescriptionSourceTypes,
  TypeDescriptionXML,
  TypeDescriptionXMLType,
} from "./types"
import { normalizeImportedTypeDescriptionName } from "./xmlTypeNames"

type SourceType = TypeDescriptionXMLType | XmlElementNode
type SourceTypes = SourceType | SourceType[] | undefined

export const importTypeDescriptionFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: TypeDescriptionXML | XmlElementNode | undefined
): TypeDescription | undefined => {
  if (!xml) return undefined

  const typeXML = isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:Type") : xml["v8:Type"]
  const typeSetXML = isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:TypeSet") : xml["v8:TypeSet"]
  const types = extractTypesFromValues(typeXML, typeSetXML)
  const typeId = getTypeIds(isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:TypeId") : xml["v8:TypeId"])
  const stringQualifiers = getStringQualifiers(_context, isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:StringQualifiers")[0] : xml["v8:StringQualifiers"])
  const numberQualifiers = getNumberQualifiers(_context, isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:NumberQualifiers")[0] : xml["v8:NumberQualifiers"])
  const dateQualifiers = getDateQualifiers(isXmlElementNode(xml) ? xmlElementChildren(xml, "v8:DateQualifiers")[0] : xml["v8:DateQualifiers"])

  const result: TypeDescription = {
    type: types,
    ...(typeId !== undefined && { typeId }),
    ...(stringQualifiers !== undefined && { stringQualifiers }),
    ...(numberQualifiers !== undefined && { numberQualifiers }),
    ...(dateQualifiers !== undefined && { dateQualifiers }),
  }

  if (result.type.length === 0 && result.typeId === undefined) return undefined
  const sourceTypes = extractSourceTypes(typeXML, typeSetXML)
  if (Object.keys(sourceTypes).length > 0) {
    Object.defineProperty(result, TYPE_DESCRIPTION_SOURCE_TYPES, {
      value: sourceTypes,
      enumerable: false,
    })
  }

  return result
}

export const extractTypes = (item: TypeDescriptionXML | XmlElementNode): string[] => {
  if (isXmlElementNode(item)) return extractTypesFromValues(xmlElementChildren(item, "v8:Type"), xmlElementChildren(item, "v8:TypeSet"))
  return extractTypesFromValues(item["v8:Type"], item["v8:TypeSet"])
}

const extractTypesFromValues = (
  typeXML: SourceTypes,
  typeSetXML: SourceTypes
): string[] => {
  const type = getTypes(typeXML)
  const typeSet = getTypes(typeSetXML)

  const result: string[] = []
  if (type !== undefined) result.push(...type)
  if (typeSet !== undefined) result.push(...typeSet)

  return result
}

export const getTypes = (type: SourceTypes): string[] | undefined => {
  if (type === undefined) return undefined

  let typeArray = Array.isArray(type) ? type : [type]

  return typeArray.map((typeItem) => getType(typeItem))
}

const extractSourceTypes = (
  typeXML: SourceTypes,
  typeSetXML: SourceTypes
): TypeDescriptionSourceTypes => {
  const result: TypeDescriptionSourceTypes = {}
  for (const type of toTypeArray(typeXML)) setSourceType(result, type)
  for (const type of toTypeArray(typeSetXML)) setSourceType(result, type)

  return result
}

const toTypeArray = (type: SourceTypes): SourceType[] => {
  if (type === undefined) return []
  return Array.isArray(type) ? type : [type]
}

const setSourceType = (sourceTypes: TypeDescriptionSourceTypes, type: SourceType): void => {
  const value = getTypeText(type)
  if (value === undefined) return

  const semanticType = removeTypePrefix(value)
  const namespace = getTypeNamespace(type, value)
  sourceTypes[semanticType] = {
    value,
    ...(namespace !== undefined ? { namespace } : undefined),
  }
}

const getTypeIds = (typeId: TypeDescriptionXML["v8:TypeId"] | unknown): string[] | undefined => {
  if (typeId === undefined) return undefined

  const typeIds = Array.isArray(typeId) ? typeId : [typeId]
  const nonEmptyTypeIds: string[] = []
  for (const item of typeIds) {
    const value = isXmlElementNode(item)
      ? item.attributes.length === 0 && item.content.every(node => node.type === "text") ? xmlTextValue(item) : undefined
      : item
    if (typeof value === "string" && value.trim() !== "") nonEmptyTypeIds.push(value)
  }

  return nonEmptyTypeIds.length > 0 ? nonEmptyTypeIds : undefined
}

export const getType = (type: SourceType): string => {
  const text = getTypeText(type)

  if (text === undefined) throw new Error("Type is undefined")

  return normalizeImportedTypeDescriptionName(removeTypePrefix(text))
}

const getTypeText = (type: SourceType): string | undefined =>
  isXmlElementNode(type)
    ? type.content.some(node => node.type === "text") || type.content.length === 0 && type.attributes.length === 0 ? xmlTextValue(type) : undefined
    : typeof type === "string" ? type : type["#text"]

const getTypeNamespace = (type: SourceType, value: string): string | undefined => {
  if (typeof type === "string") return undefined

  const prefix = getTypePrefix(value)
  if (prefix === undefined) return undefined

  if (isXmlElementNode(type)) return xmlAttributeValue(type, `xmlns:${prefix}`)
  const namespaces: Record<`_xmlns:${string}`, string> = type
  return namespaces[`_xmlns:${prefix}`]
}

const importQualifierNumber = (context: ConfigurationContext, value: number | string | undefined): number | undefined =>
  importNumberFromXML(context, undefined, value)

const qualifierText = (node: XmlElementNode, name: string): string | undefined => {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child)
}

function getStringQualifiers(
  context: ConfigurationContext,
  xml?: TypeDescriptionXML["v8:StringQualifiers"] | XmlElementNode
):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined

  const length = importQualifierNumber(context, isXmlElementNode(xml) ? qualifierText(xml, "v8:Length") : xml["v8:Length"])
  if (length === undefined) return undefined

  const result = {
    length,
    allowedLength: isXmlElementNode(xml) ? qualifierText(xml, "v8:AllowedLength") as "Variable" | "Fixed" : xml["v8:AllowedLength"],
  }

  // Возвращаем undefined для дефолтных значений
  if (result.length === 0 && result.allowedLength === "Variable") {
    return undefined
  }

  return result
}

function getNumberQualifiers(context: ConfigurationContext, xml?: TypeDescriptionXML["v8:NumberQualifiers"] | XmlElementNode) {
  if (!xml) return undefined

  const digits = importQualifierNumber(context, isXmlElementNode(xml) ? qualifierText(xml, "v8:Digits") : xml["v8:Digits"])
  const fractionDigits = importQualifierNumber(context, isXmlElementNode(xml) ? qualifierText(xml, "v8:FractionDigits") : xml["v8:FractionDigits"])
  if (digits === undefined || fractionDigits === undefined) return undefined

  const result = {
    digits,
    fractionDigits,
    allowedSign: isXmlElementNode(xml) ? qualifierText(xml, "v8:AllowedSign") as "Any" | "Nonnegative" : xml["v8:AllowedSign"],
  }

  // Возвращаем undefined для дефолтных значений
  if (result.digits === 0 && result.fractionDigits === 0 && result.allowedSign === "Any") {
    return undefined
  }

  return result
}

function getDateQualifiers(xml?: TypeDescriptionXML["v8:DateQualifiers"] | XmlElementNode) {
  if (!xml) return undefined

  return {
    dateFractions: isXmlElementNode(xml) ? qualifierText(xml, "v8:DateFractions") as "Date" | "Time" | "DateTime" | undefined : xml["v8:DateFractions"],
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "importFromXML", importTypeDescriptionFromXML)
