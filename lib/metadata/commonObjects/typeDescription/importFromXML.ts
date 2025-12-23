import { ConfigurationSettings } from "../../configurationSettings/types"
import { TypeDescription, TypeDescriptionXML, TypeDescriptionXMLType } from "./types"

const TypePrefixes = ["xs:", "cfg:", "mxl:"]

export const importTypeDescriptionFromXML = (
  _configurationSettings: ConfigurationSettings,
  xml: TypeDescriptionXML | undefined
): TypeDescription | undefined => {
  if (!xml) return undefined

  const types = extractTypes(xml)

  const result: TypeDescription = {
    type: types,
    stringQualifiers: getStringQualifiers(xml["v8:StringQualifiers"]),
    numberQualifiers: getNumberQualifiers(xml["v8:NumberQualifiers"]),
    dateQualifiers: getDateQualifiers(xml["v8:DateQualifiers"]),
  }

  return result
}

export const extractTypes = (item: TypeDescriptionXML): string[] => {
  const type = getTypes(item["v8:Type"])
  if (type !== undefined) return type

  const typeSet = getTypes(item["v8:TypeSet"])
  if (typeSet !== undefined) return typeSet

  throw new Error("Type is undefined")
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
  for (const prefix of TypePrefixes) {
    if (type.startsWith(prefix)) return type.substring(prefix.length)
  }
  return type
}

function getStringQualifiers(xml?: TypeDescriptionXML["v8:StringQualifiers"]):
  | {
      length: number
      allowedLength: "Variable" | "Fixed"
    }
  | undefined {
  if (xml === undefined) return undefined
  return {
    length: xml["v8:Length"],
    allowedLength: xml["v8:AllowedLength"],
  }
}

function getNumberQualifiers(xml?: TypeDescriptionXML["v8:NumberQualifiers"]) {
  if (!xml) return undefined

  return {
    digits: xml["v8:Digits"],
    fractionDigits: xml["v8:FractionDigits"],
    allowedSign: xml["v8:AllowedSign"],
  }
}

function getDateQualifiers(xml?: TypeDescriptionXML["v8:DateQualifiers"]) {
  if (!xml) return undefined

  return {
    dateFractions: xml["v8:DateFractions"],
  }
}
