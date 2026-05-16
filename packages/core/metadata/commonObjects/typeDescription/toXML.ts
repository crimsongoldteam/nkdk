import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { getSystemEnumerationTypeDescriptionRule, getTypeDescriptionRule, getTypePrefix, removeTypePrefix } from "./helper"
import {
  TYPE_DESCRIPTION_SOURCE_TYPES,
  TYPE_DESCRIPTION_XML_CONTAINER_BY_TYPE,
  TypeDescription,
  TypeDescriptionRule,
  TypeDescriptionSourceType,
  TypeDescriptionSourceTypes,
  TypeDescriptionXML,
  TypeDescriptionXMLContainerByType,
  TypeDescriptionXMLType,
  TypeDescriptionTypeWithNamespaceXML,
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
  const referenceSourceTypes = getReferenceSourceTypes(referenceTypeDescription)
  const typesXML = getTypesXML(
    typeDescription,
    shouldDeclareTypeNamespace(_rule),
    referenceContainerByType,
    referenceSourceTypes
  )
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
  referenceContainerByType: TypeDescriptionXMLContainerByType | undefined,
  referenceSourceTypes: TypeDescriptionSourceTypes | undefined
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

    const sourceType = getMatchingReferenceSourceType(type, rule, referenceSourceTypes)
    const item =
      sourceType !== undefined
        ? getSourceTypeXML(sourceType)
        : getCanonicalTypeXML(type, rule, declareTypeNamespace)

    if (referenceContainerByType?.[type] === "TypeSetAttribute") {
      typesXML.push(item)
    } else if (referenceContainerByType?.[type] === "TypeSet") {
      typeSetXML.push(item)
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

const getReferenceSourceTypes = (
  referenceTypeDescription: TypeDescription | undefined
): TypeDescriptionSourceTypes | undefined => {
  if (!referenceTypeDescription) return undefined
  return referenceTypeDescription[TYPE_DESCRIPTION_SOURCE_TYPES]
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

const getMatchingReferenceSourceType = (
  type: string,
  rule: TypeDescriptionRule,
  referenceSourceTypes: TypeDescriptionSourceTypes | undefined
): TypeDescriptionSourceType | undefined => {
  const sourceType = referenceSourceTypes?.[type]
  if (sourceType === undefined) return undefined
  if (removeTypePrefix(sourceType.value) !== type) return undefined
  if (sourceType.namespace !== rule.namespace) return undefined

  return sourceType
}

const getSourceTypeXML = (sourceType: TypeDescriptionSourceType): TypeDescriptionXMLType => {
  if (sourceType.namespace === undefined) return sourceType.value

  const prefix = getTypePrefix(sourceType.value)
  if (prefix === undefined) return sourceType.value

  const item: TypeDescriptionTypeWithNamespaceXML = {
    [`_xmlns:${prefix}`]: sourceType.namespace,
    "#text": sourceType.value,
  }

  return item
}

const getCanonicalTypeXML = (
  type: string,
  rule: TypeDescriptionRule,
  declareTypeNamespace: boolean
): TypeDescriptionXMLType => {
  const typeXML = `${rule.prefix}:${type}`
  return shouldExportTypeNamespace(rule, declareTypeNamespace)
    ? {
        [`_xmlns:${rule.prefix}`]: rule.namespace,
        "#text": typeXML,
      }
    : typeXML
}

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
