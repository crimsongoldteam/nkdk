import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { getTypeDescriptionRule } from "./helper"
import { TypeDescription, TypeDescriptionXML, TypeDescriptionXMLType } from "./types"

export const exportTypeDescriptionToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined
): TypeDescriptionXML | undefined => {
  if (!typeDescription) return undefined
  const stringQualifiers = getStringQualifiers(typeDescription)
  const numberQualifiers = getNumberQualifiers(typeDescription)
  const dateQualifiers = getDateQualifiers(typeDescription)

  const typesXML = getTypesXML(typeDescription)

  const result = {
    ...typesXML,
    ...(numberQualifiers !== undefined ? { "v8:NumberQualifiers": numberQualifiers } : undefined),
    ...(stringQualifiers !== undefined ? { "v8:StringQualifiers": stringQualifiers } : undefined),
    ...(dateQualifiers !== undefined ? { "v8:DateQualifiers": dateQualifiers } : undefined),
  }

  return result
}

const getTypesXML = (
  typeDescription: TypeDescription
): {
  "v8:Type"?: TypeDescriptionXMLType[] | TypeDescriptionXMLType
  "v8:TypeSet"?: TypeDescriptionXMLType[] | TypeDescriptionXMLType
} => {
  const types = Array.isArray(typeDescription.type) ? typeDescription.type : [typeDescription.type]

  const typesXML: TypeDescriptionXMLType[] = []
  const typeSetXML: TypeDescriptionXMLType[] = []

  for (const type of types) {
    const dotIndex = type.indexOf(".")
    const isComplex = dotIndex !== -1
    const baseType = isComplex ? type.substring(0, dotIndex) : type

    const rule = getTypeDescriptionRule(baseType)
    if (!rule) throw new Error(`Type ${type} not found in TypeDescriptionRules`)

    const typeXML = `${rule.prefix}:${type}`
    const item = rule.namespace
      ? {
          [`_xmlns:${rule.prefix}`]: rule.namespace,
          "#text": typeXML,
        }
      : typeXML

    if (rule.modifier === "typeset" || (rule.modifier === "complex" && !isComplex)) {
      typeSetXML.push(item)
    } else {
      typesXML.push(item)
    }
  }

  return {
    ...(typesXML.length > 0 ? { "v8:Type": typesXML.length === 1 ? typesXML[0] : typesXML } : undefined),
    ...(typeSetXML.length > 0 ? { "v8:TypeSet": typeSetXML.length === 1 ? typeSetXML[0] : typeSetXML } : undefined),
  }
}

const getStringQualifiers = (
  typeDescription: TypeDescription
): TypeDescriptionXML["v8:StringQualifiers"] | undefined => {
  if (!typeDescription.type.includes("string")) return undefined

  const stringQualifiers = typeDescription.stringQualifiers

  if (!stringQualifiers) {
    return {
      "v8:Length": 0,
      "v8:AllowedLength": "Variable",
    }
  }

  return {
    "v8:Length": stringQualifiers.length,
    "v8:AllowedLength": stringQualifiers.allowedLength,
  }
}

const getNumberQualifiers = (
  typeDescription: TypeDescription
): TypeDescriptionXML["v8:NumberQualifiers"] | undefined => {
  if (!typeDescription.type.includes("decimal")) return undefined

  const numberQualifiers = typeDescription.numberQualifiers

  if (!numberQualifiers) {
    return {
      "v8:Digits": 0,
      "v8:FractionDigits": 0,
      "v8:AllowedSign": "Any",
    }
  }

  return {
    "v8:Digits": numberQualifiers.digits,
    "v8:FractionDigits": numberQualifiers.fractionDigits,
    "v8:AllowedSign": numberQualifiers.allowedSign,
  }
}

const getDateQualifiers = (typeDescription: TypeDescription): TypeDescriptionXML["v8:DateQualifiers"] | undefined => {
  if (!typeDescription.type.includes("dateTime")) return undefined

  const dateQualifiers = typeDescription.dateQualifiers

  if (!dateQualifiers) {
    return {
      "v8:DateFractions": "DateTime",
    }
  }

  return {
    "v8:DateFractions": dateQualifiers.dateFractions,
  }
}

registerTypeRule("TypeDescription", "exportToXML", exportTypeDescriptionToXML)
