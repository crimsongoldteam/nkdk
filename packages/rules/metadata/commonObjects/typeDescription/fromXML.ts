import { importNumberFromXML } from "../number/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext, isEmptyXmlElement, xmlAttributeValue, xmlElementChildren, xmlTextValue, type XmlElementNode } from "@nkdk/runtime"
import { getTypePrefix, removeTypePrefix, getTypeDescriptionRuleOrSystemEnumeration } from "./helper"
import {
  TypeDescription,
} from "./types"
import { normalizeImportedTypeDescriptionName } from "./xmlTypeNames"

type SourceTypes = readonly XmlElementNode[]

export const importTypeDescriptionFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: XmlElementNode | undefined
): TypeDescription | undefined => {
  if (xml === undefined) return undefined

  const typeXML: XmlElementNode[] = []
  const typeSetXML: XmlElementNode[] = []
  const typeIdsXML: XmlElementNode[] = []
  let stringXML: XmlElementNode | undefined
  let numberXML: XmlElementNode | undefined
  let dateXML: XmlElementNode | undefined
  for (const child of xml.content) {
    if (child.type !== "element") continue
    switch (child.name) {
      case "v8:Type": typeXML.push(child); break
      case "v8:TypeSet": typeSetXML.push(child); break
      case "v8:TypeId": typeIdsXML.push(child); break
      case "v8:StringQualifiers": stringXML ??= child; break
      case "v8:NumberQualifiers": numberXML ??= child; break
      case "v8:DateQualifiers": dateXML ??= child; break
    }
  }
  const types = [...getTypes(typeXML), ...getTypes(typeSetXML)]
  const typeId = getTypeIds(typeIdsXML)
  const stringQualifiers = getStringQualifiers(_context, stringXML)
  const numberQualifiers = getNumberQualifiers(_context, numberXML)
  const dateQualifiers = getDateQualifiers(dateXML)

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

const getTypes = (types: SourceTypes): string[] => {
  if (types.length === 1 && isEmptyXmlElement(types[0]!)) return []
  return types.map(getType)
}

const getTypeIds = (nodes: SourceTypes): string[] | undefined => {
  const result: string[] = []
  for (const node of nodes) {
    if (node.attributes.length > 0 || node.content.some(child => child.type !== "text")) continue
    const value = xmlTextValue(node)
    if (value.trim() !== "") result.push(value)
  }
  return result.length > 0 ? result : undefined
}

const getType = (type: XmlElementNode): string => {
  const text = xmlTextValue(type)
  if (text === "") throw new Error("Type is undefined")
  const semanticType = normalizeImportedTypeDescriptionName(removeTypePrefix(text))
  const prefix = getTypePrefix(text)
  validateSourceTypePrefix(semanticType, text, prefix === undefined ? undefined : xmlAttributeValue(type, `xmlns:${prefix}`))
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

const importQualifierNumber = (context: ConfigurationContext, value: number | string | undefined): number | undefined =>
  importNumberFromXML(context, undefined, value)

const qualifierText = (node: XmlElementNode, name: string): string | undefined => {
  const child = xmlElementChildren(node, name)[0]
  return child === undefined ? undefined : xmlTextValue(child)
}

function getStringQualifiers(
  context: ConfigurationContext,
  xml?: XmlElementNode
):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined

  const length = importQualifierNumber(context, qualifierText(xml, "v8:Length"))
  if (length === undefined) return undefined

  const result = {
    length,
    allowedLength: qualifierText(xml, "v8:AllowedLength") as "Variable" | "Fixed",
  }

  // Возвращаем undefined для дефолтных значений
  if (result.length === 0 && result.allowedLength === "Variable") {
    return undefined
  }

  return result
}

function getNumberQualifiers(context: ConfigurationContext, xml?: XmlElementNode) {
  if (!xml) return undefined

  const digits = importQualifierNumber(context, qualifierText(xml, "v8:Digits"))
  const fractionDigits = importQualifierNumber(context, qualifierText(xml, "v8:FractionDigits"))
  if (digits === undefined || fractionDigits === undefined) return undefined

  const result = {
    digits,
    fractionDigits,
    allowedSign: qualifierText(xml, "v8:AllowedSign") as "Any" | "Nonnegative",
  }

  // Возвращаем undefined для дефолтных значений
  if (result.digits === 0 && result.fractionDigits === 0 && result.allowedSign === "Any") {
    return undefined
  }

  return result
}

function getDateQualifiers(xml?: XmlElementNode) {
  if (!xml) return undefined

  return {
    dateFractions: qualifierText(xml, "v8:DateFractions") as "Date" | "Time" | "DateTime" | undefined,
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "importFromXML", importTypeDescriptionFromXML)
