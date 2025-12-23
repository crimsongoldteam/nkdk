import { Context } from "../../context/types"
import { TypeDescription, TypeDescriptionXML } from "./types"

export const exportTypeDescriptionToXML = (
  _configurationSettings: Context,
  typeDescription: TypeDescription | undefined
): TypeDescriptionXML | undefined => {
  if (!typeDescription) return undefined

  const result: TypeDescriptionXML = {
    "v8:Type": typeDescription.type.map((type) => mapType(type)),
    "v8:StringQualifiers": getStringQualifiers(typeDescription.stringQualifiers),
    "v8:NumberQualifiers": getNumberQualifiers(typeDescription.numberQualifiers),
    "v8:DateQualifiers": getDateQualifiers(typeDescription.dateQualifiers),
  }

  return result
}

const mapType = (type: string): string => {
  if (type === "string" || type === "decimal" || type === "dateTime" || type === "boolean") {
    return `xs:${type}`
  }

  if (
    type.startsWith("DataProcessorObject.") ||
    type.startsWith("CatalogObject.") ||
    type.startsWith("DocumentObject.") ||
    type.startsWith("BusinessProcessObject.") ||
    type.startsWith("TaskObject.") ||
    type.startsWith("EnumRef.")
  ) {
    return `cfg:${type}`
  }

  return `cfg:${type}`
}

const getStringQualifiers = (
  stringQualifiers: TypeDescription["stringQualifiers"]
): TypeDescriptionXML["v8:StringQualifiers"] | undefined => {
  if (!stringQualifiers) return undefined
  return {
    "v8:Length": stringQualifiers.length,
    "v8:AllowedLength": stringQualifiers.allowedLength,
  }
}

const getNumberQualifiers = (
  numberQualifiers: TypeDescription["numberQualifiers"]
): TypeDescriptionXML["v8:NumberQualifiers"] | undefined => {
  if (!numberQualifiers) return undefined
  return {
    "v8:Digits": numberQualifiers.digits,
    "v8:FractionDigits": numberQualifiers.fractionDigits,
    "v8:AllowedSign": numberQualifiers.allowedSign,
  }
}

const getDateQualifiers = (
  dateQualifiers: TypeDescription["dateQualifiers"]
): TypeDescriptionXML["v8:DateQualifiers"] | undefined => {
  if (!dateQualifiers) return undefined
  return {
    "v8:DateFractions": dateQualifiers.dateFractions,
  }
}
