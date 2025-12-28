import { Context } from "../../context/types"
import { compactObject } from "../../helpers/compactObject"
import { TypeDescription, TypeDescriptionXML } from "./types"

export const exportTypeDescriptionToXML = (
  _context: Context,
  typeDescription: TypeDescription | undefined
): TypeDescriptionXML | undefined => {
  if (!typeDescription) return undefined

  const result = compactObject<TypeDescriptionXML>({
    "v8:StringQualifiers": getStringQualifiers(typeDescription.stringQualifiers),
    "v8:NumberQualifiers": getNumberQualifiers(typeDescription.numberQualifiers),
    "v8:DateQualifiers": getDateQualifiers(typeDescription.dateQualifiers),
    "v8:Type": typeDescription.type.map((type) => mapType(type)),
  })

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
    "v8:AllowedLength": stringQualifiers.allowedLength,
    "v8:Length": stringQualifiers.length,
  }
}

const getNumberQualifiers = (
  numberQualifiers: TypeDescription["numberQualifiers"]
): TypeDescriptionXML["v8:NumberQualifiers"] | undefined => {
  if (!numberQualifiers) return undefined
  return {
    "v8:AllowedSign": numberQualifiers.allowedSign,
    "v8:Digits": numberQualifiers.digits,
    "v8:FractionDigits": numberQualifiers.fractionDigits,
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
