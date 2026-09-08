import { importNumberFromXML } from "../number/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, isEmptyXmlElement, isXmlElementNode, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { getTypePrefix, removeTypePrefix, getTypeDescriptionRuleOrSystemEnumeration } from "./helper"
import {
  TypeDescription,
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
  const only = typeArray.length === 1 ? typeArray[0] : undefined
  if (isXmlElementNode(only) && isEmptyXmlElement(only)) return undefined

  return typeArray.map((typeItem) => getType(typeItem))
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

  const semanticType = normalizeImportedTypeDescriptionName(removeTypePrefix(text))
  validateSourceTypePrefix(semanticType, text, getTypeNamespace(type, text))
  return semanticType
}

function validateSourceTypePrefix(type: string, text: string, namespace: string | undefined): void {
  const prefix = getTypePrefix(text)
  if (prefix === undefined) return
  const separator = type.indexOf(".")
  const rule = getTypeDescriptionRuleOrSystemEnumeration(separator === -1 ? type : type.slice(0, separator))
  if (rule === undefined) return
  const expectedNamespace = rule.prefix === "cfg"
    ? "http://v8.1c.ru/8.1/data/enterprise/current-config"
    : rule.namespace
  if (prefix === rule.prefix && (namespace === undefined || expectedNamespace === undefined || namespace === expectedNamespace)) return
  const generated = /^d(\d+)p1$/.exec(prefix)
  if (generated !== null && namespace === expectedNamespace
    && (rule.prefix === "cfg" ? Number(generated[1]) % 2 === 0 : rule.namespace !== undefined && Number(generated[1]) % 2 === 1)) return
  throw new Error(`Тип ${type}: несовместимый XML-префикс ${prefix}`)
}

const getTypeText = (type: SourceType): string | undefined =>
  isXmlElementNode(type)
    ? xmlTextValue(type) || undefined
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
