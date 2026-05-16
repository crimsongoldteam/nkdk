import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { getSystemEnumerationTypeDescriptionRule, getTypeDescriptionRule } from "./helper"
import {
  TYPE_DESCRIPTION_XML_CONTAINER_BY_TYPE,
  TypeDescription,
  TypeDescriptionXML,
  TypeDescriptionXMLContainerByType,
  TypeDescriptionXMLType,
} from "./types"

type TypeDescriptionXMLWithTypeSetAttribute = TypeDescriptionXML & { "_xsi:type"?: "v8:TypeSet" }

export const exportTypeDescriptionToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeDescription: TypeDescription | undefined,
  referenceTypeDescription?: TypeDescription
): TypeDescriptionXML | undefined => {
  if (!typeDescription) return undefined
  const stringQualifiers = getStringQualifiers(typeDescription)
  const numberQualifiers = getNumberQualifiers(typeDescription)
  const dateQualifiers = getDateQualifiers(typeDescription)

  const referenceContainerByType = getMatchingReferenceContainerByType(typeDescription, referenceTypeDescription)
  const typesXML = getTypesXML(typeDescription, shouldDeclareTypeNamespace(_rule), referenceContainerByType)
  const typeIdXML = getTypeIdXML(typeDescription)
  const sourceTypeSetMarkerXML = getSourceTypeSetMarkerXML(
    typeDescription,
    referenceTypeDescription,
    referenceContainerByType
  )

  const result = {
    ...sourceTypeSetMarkerXML,
    ...typesXML,
    ...(typeIdXML !== undefined ? { "v8:TypeId": typeIdXML } : undefined),
    ...(numberQualifiers !== undefined ? { "v8:NumberQualifiers": numberQualifiers } : undefined),
    ...(stringQualifiers !== undefined ? { "v8:StringQualifiers": stringQualifiers } : undefined),
    ...(dateQualifiers !== undefined ? { "v8:DateQualifiers": dateQualifiers } : undefined),
  }

  return result
}

const shouldDeclareTypeNamespace = (rule: PropertyRule | undefined): boolean =>
  Boolean(rule && "declareTypeNamespaceXML" in rule && rule.declareTypeNamespaceXML)

const getTypesXML = (
  typeDescription: TypeDescription,
  declareTypeNamespace: boolean,
  referenceContainerByType: TypeDescriptionXMLContainerByType | undefined
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

    const rule = getTypeDescriptionRule(baseType) ?? (!isComplex ? getSystemEnumerationTypeDescriptionRule(type) : undefined)
    if (!rule) throw new Error(`Type ${type} not found in TypeDescriptionRules`)

    const typeXML = `${rule.prefix}:${type}`
    const item = shouldExportTypeNamespace(rule, declareTypeNamespace)
      ? {
          [`_xmlns:${rule.prefix}`]: rule.namespace,
          "#text": typeXML,
        }
      : typeXML

    if (referenceContainerByType?.[type] === "TypeSetAttribute") {
      typesXML.push(item)
    } else if (rule.modifier === "typeset" || (rule.modifier === "complex" && !isComplex)) {
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

const getMatchingReferenceContainerByType = (
  typeDescription: TypeDescription,
  referenceTypeDescription: TypeDescription | undefined
): TypeDescriptionXMLContainerByType | undefined => {
  if (!referenceTypeDescription || !isSameTypes(typeDescription.type, referenceTypeDescription.type)) return undefined
  return referenceTypeDescription[TYPE_DESCRIPTION_XML_CONTAINER_BY_TYPE]
}

const getSourceTypeSetMarkerXML = (
  typeDescription: TypeDescription,
  referenceTypeDescription: TypeDescription | undefined,
  referenceContainerByType: TypeDescriptionXMLContainerByType | undefined
): TypeDescriptionXMLWithTypeSetAttribute | { "_xsi:type": undefined } | undefined => {
  if (!referenceTypeDescription?.[TYPE_DESCRIPTION_XML_CONTAINER_BY_TYPE]) return undefined
  if (!referenceContainerByType) return { "_xsi:type": undefined }
  return typeDescription.type.some((type) => referenceContainerByType[type] === "TypeSetAttribute")
    ? { "_xsi:type": "v8:TypeSet" }
    : undefined
}

const isSameTypes = (left: string[], right: string[]): boolean =>
  left.length === right.length && left.every((type, index) => type === right[index])

const shouldExportTypeNamespace = (
  rule: ReturnType<typeof getTypeDescriptionRule>,
  declareTypeNamespace: boolean
): rule is NonNullable<typeof rule> & { namespace: string } =>
  Boolean(rule?.namespace && (declareTypeNamespace || rule.prefix !== "dcsset"))

const getTypeIdXML = (typeDescription: TypeDescription): TypeDescriptionXML["v8:TypeId"] | undefined => {
  if (typeDescription.typeId === undefined || typeDescription.typeId.length === 0) return undefined

  return typeDescription.typeId.length === 1 ? typeDescription.typeId[0] : typeDescription.typeId
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
