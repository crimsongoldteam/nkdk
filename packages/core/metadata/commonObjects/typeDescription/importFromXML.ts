import { ConfigurationContext } from "../../context/types"
import { TypeDescription, TypeDescriptionPrefixes, TypeDescriptionXML, TypeDescriptionXMLType } from "./types"

export const importTypeDescriptionFromXML = (
  _context: ConfigurationContext,
  xml: TypeDescriptionXML | undefined
): TypeDescription | undefined => {
  if (!xml) return undefined

  const types = extractTypes(xml)
  const stringQualifiers = getStringQualifiers(xml["v8:StringQualifiers"])
  const numberQualifiers = getNumberQualifiers(xml["v8:NumberQualifiers"])
  const dateQualifiers = getDateQualifiers(xml["v8:DateQualifiers"])

  const result: TypeDescription = {
    type: types,
    ...(stringQualifiers !== undefined && { stringQualifiers }),
    ...(numberQualifiers !== undefined && { numberQualifiers }),
    ...(dateQualifiers !== undefined && { dateQualifiers }),
  }

  if (result.type.length === 0) return undefined

  return result
}

export const extractTypes = (item: TypeDescriptionXML): string[] => {
  const type = getTypes(item["v8:Type"])
  const typeSet = getTypes(item["v8:TypeSet"])

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

export const getType = (type: TypeDescriptionXMLType): string => {
  const text = typeof type === "string" ? type : type["#text"]

  if (text === undefined) throw new Error("Type is undefined")

  return removeTypePrefix(text)
}

const removeTypePrefix = (type: string): string => {
  const colonIndex = type.indexOf(":")
  if (colonIndex === -1) return type

  const prefix = type.substring(0, colonIndex)
  const typeName = type.substring(colonIndex + 1)

  if (TypeDescriptionPrefixes[prefix]) return typeName

  return typeName
}

function getStringQualifiers(xml?: TypeDescriptionXML["v8:StringQualifiers"]):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined

  const result = {
    length: xml["v8:Length"],
    allowedLength: xml["v8:AllowedLength"],
  }

  // Возвращаем undefined для дефолтных значений
  if (result.length === 0 && result.allowedLength === "Variable") {
    return undefined
  }

  return result
}

function getNumberQualifiers(xml?: TypeDescriptionXML["v8:NumberQualifiers"]) {
  if (!xml) return undefined

  const result = {
    digits: xml["v8:Digits"],
    fractionDigits: xml["v8:FractionDigits"],
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
