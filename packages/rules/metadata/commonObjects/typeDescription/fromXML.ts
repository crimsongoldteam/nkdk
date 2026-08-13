import { importNumberFromXML } from "../number/fromXML"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { ConfigurationContext } from "@nkdk/runtime"
import { getTypePrefix, removeTypePrefix } from "./helper"
import {
  TYPE_DESCRIPTION_SOURCE_TYPES,
  TypeDescription,
  TypeDescriptionSourceTypes,
  TypeDescriptionXML,
  TypeDescriptionXMLType,
} from "./types"
import { normalizeImportedTypeDescriptionName } from "./xmlTypeNames"

export const importTypeDescriptionFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  xml: TypeDescriptionXML | undefined
): TypeDescription | undefined => {
  if (!xml) return undefined

  const typeXML = xml["v8:Type"]
  const typeSetXML = xml["v8:TypeSet"]
  const types = extractTypesFromValues(typeXML, typeSetXML)
  const typeId = getTypeIds(xml["v8:TypeId"])
  const stringQualifiers = getStringQualifiers(_context, xml["v8:StringQualifiers"])
  const numberQualifiers = getNumberQualifiers(_context, xml["v8:NumberQualifiers"])
  const dateQualifiers = getDateQualifiers(xml["v8:DateQualifiers"])

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

export const extractTypes = (item: TypeDescriptionXML): string[] => {
  return extractTypesFromValues(item["v8:Type"], item["v8:TypeSet"])
}

const extractTypesFromValues = (
  typeXML: TypeDescriptionXML["v8:Type"],
  typeSetXML: TypeDescriptionXML["v8:TypeSet"]
): string[] => {
  const type = getTypes(typeXML)
  const typeSet = getTypes(typeSetXML)

  const result: string[] = []
  if (type !== undefined) result.push(...type)
  if (typeSet !== undefined) result.push(...typeSet)

  return result
}

export const getTypes = (type: TypeDescriptionXMLType | TypeDescriptionXMLType[] | undefined): string[] | undefined => {
  if (type === undefined) return undefined

  let typeArray = Array.isArray(type) ? type : [type]

  return typeArray.map((typeItem) => getType(typeItem))
}

const extractSourceTypes = (
  typeXML: TypeDescriptionXML["v8:Type"],
  typeSetXML: TypeDescriptionXML["v8:TypeSet"]
): TypeDescriptionSourceTypes => {
  const result: TypeDescriptionSourceTypes = {}
  for (const type of toTypeArray(typeXML)) setSourceType(result, type)
  for (const type of toTypeArray(typeSetXML)) setSourceType(result, type)

  return result
}

const toTypeArray = (type: TypeDescriptionXMLType | TypeDescriptionXMLType[] | undefined): TypeDescriptionXMLType[] => {
  if (type === undefined) return []
  return Array.isArray(type) ? type : [type]
}

const setSourceType = (sourceTypes: TypeDescriptionSourceTypes, type: TypeDescriptionXMLType): void => {
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
  const nonEmptyTypeIds = typeIds.filter((item): item is string => typeof item === "string" && item.trim() !== "")

  return nonEmptyTypeIds.length > 0 ? nonEmptyTypeIds : undefined
}

export const getType = (type: TypeDescriptionXMLType): string => {
  const text = getTypeText(type)

  if (text === undefined) throw new Error("Type is undefined")

  return normalizeImportedTypeDescriptionName(removeTypePrefix(text))
}

const getTypeText = (type: TypeDescriptionXMLType): string | undefined =>
  typeof type === "string" ? type : type["#text"]

const getTypeNamespace = (type: TypeDescriptionXMLType, value: string): string | undefined => {
  if (typeof type === "string") return undefined

  const prefix = getTypePrefix(value)
  if (prefix === undefined) return undefined

  const namespaces: Record<`_xmlns:${string}`, string> = type
  return namespaces[`_xmlns:${prefix}`]
}

const importQualifierNumber = (context: ConfigurationContext, value: number | string | undefined): number | undefined =>
  importNumberFromXML(context, undefined, value)

function getStringQualifiers(
  context: ConfigurationContext,
  xml?: TypeDescriptionXML["v8:StringQualifiers"]
):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined

  const length = importQualifierNumber(context, xml["v8:Length"])
  if (length === undefined) return undefined

  const result = {
    length,
    allowedLength: xml["v8:AllowedLength"],
  }

  // Возвращаем undefined для дефолтных значений
  if (result.length === 0 && result.allowedLength === "Variable") {
    return undefined
  }

  return result
}

function getNumberQualifiers(context: ConfigurationContext, xml?: TypeDescriptionXML["v8:NumberQualifiers"]) {
  if (!xml) return undefined

  const digits = importQualifierNumber(context, xml["v8:Digits"])
  const fractionDigits = importQualifierNumber(context, xml["v8:FractionDigits"])
  if (digits === undefined || fractionDigits === undefined) return undefined

  const result = {
    digits,
    fractionDigits,
    allowedSign: xml["v8:AllowedSign"],
  }

  // Возвращаем undefined для дефолтных значений
  if (result.digits === 0 && result.fractionDigits === 0 && result.allowedSign === "Any") {
    return undefined
  }

  return result
}

function getDateQualifiers(xml?: TypeDescriptionXML["v8:DateQualifiers"]) {
  if (!xml) return undefined

  return {
    dateFractions: xml["v8:DateFractions"],
  }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "importFromXML", importTypeDescriptionFromXML)
