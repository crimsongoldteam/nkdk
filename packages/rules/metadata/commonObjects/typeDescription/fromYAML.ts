import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { ConfigurationContext } from "@nkdk/runtime"
import { formulaFormatParser } from "../../helpers/formulaFormatParser/formulaFormatParser"
import { assertTypeDescriptionYAMLAllowed, METADATA_NAME_YAML_PATTERN } from "./allowedTypes"
import { getSystemEnumerationTypeFromYAML, getTypeFromYAML } from "./helper"
import {
  PrimitiveTypeFromYAML,
  TypeDescription,
  TypeDescriptionDateQualifiers,
  TypeDescriptionNumberQualifiers,
  TypeDescriptionStringQualifiers,
  TypeDescriptionYAML,
} from "./types"

interface TypeDescriptionYAMLObject {
  ИдентификаторТипа: unknown
}

const isTypeDescriptionYAMLObject = (value: unknown): value is TypeDescriptionYAMLObject =>
  typeof value === "object" && value !== null && !Array.isArray(value) && "ИдентификаторТипа" in value

const getTypeIdsFromYAML = (typeId: unknown): string[] | undefined => {
  if (!Array.isArray(typeId)) return undefined
  const typeIds = typeId.filter((item): item is string => typeof item === "string" && item.trim() !== "")
  return typeIds.length > 0 ? typeIds : undefined
}

const externalDataSourceTablePattern = new RegExp(
  `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Таблица${METADATA_NAME_YAML_PATTERN}$`
)
const externalDataSourceCubeDimensionTablePattern = new RegExp(
  `^ВнешнийИсточникДанных${METADATA_NAME_YAML_PATTERN}\\.Куб${METADATA_NAME_YAML_PATTERN}\\.ТаблицаИзмерения${METADATA_NAME_YAML_PATTERN}$`
)

const getExternalDataSourceTypeFromYAML = (type: string): string | undefined => {
  if (externalDataSourceTablePattern.test(type)) return `ExternalDataSourceTableRef.${type}`
  if (externalDataSourceCubeDimensionTablePattern.test(type)) {
    return `ExternalDataSourceCubeDimensionTableRef.${type}`
  }
  return undefined
}

export function parseTypeDescriptionYAML(value: unknown): TypeDescription | undefined {
  if (value === undefined) return undefined

  if (isTypeDescriptionYAMLObject(value)) {
    const typeId = getTypeIdsFromYAML(value.ИдентификаторТипа)
    return typeId === undefined ? undefined : { type: [], typeId }
  }

  const stringValues = (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === "string" && item.trim() !== ""
  )
  if (stringValues.length === 0) return undefined

  const types: string[] = []
  const result: TypeDescription = { type: types }

  for (const stringValue of stringValues) {
    const { formula: type, parameters } = formulaFormatParser(stringValue)

    if (type === "Строка" || type === "ФиксированнаяСтрока") {
      types.push(PrimitiveTypeFromYAML("Строка"))
      const stringQualifiers = getStringQualifiers(parameters, type)
      if (stringQualifiers) result.stringQualifiers = stringQualifiers
      continue
    }

    if (type === "Число" || type === "ПоложительноеЧисло") {
      types.push(PrimitiveTypeFromYAML("Число"))
      const numberQualifiers = getNumberQualifiers(parameters, type)
      if (numberQualifiers) result.numberQualifiers = numberQualifiers
      continue
    }

    if (type === "Дата" || type === "Время" || type === "ДатаВремя") {
      types.push("dateTime")
      result.dateQualifiers = getDateQualifiers(type)
      continue
    }

    if (type === "Булево") {
      types.push(PrimitiveTypeFromYAML("Булево"))
      continue
    }

    const externalDataSourceType = getExternalDataSourceTypeFromYAML(type)
    if (externalDataSourceType !== undefined) {
      types.push(externalDataSourceType)
      continue
    }

    const systemEnumerationType = getSystemEnumerationTypeFromYAML(type)
    if (systemEnumerationType !== undefined) {
      types.push(systemEnumerationType)
      continue
    }

    const dotIndex = type.indexOf(".")
    const isComplex = dotIndex !== -1
    const baseType = isComplex ? type.substring(0, dotIndex) : type
    const detailType = isComplex ? type.substring(dotIndex + 1) : undefined
    const metadataType = getTypeFromYAML(baseType)
    if (metadataType) {
      types.push(isComplex ? `${metadataType}.${detailType}` : metadataType)
      continue
    }

    types.push(stringValue)
  }

  return types.length === 0 ? undefined : result
}

export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
  if (value === undefined) return undefined
  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    assertTypeDescriptionYAMLAllowed({ value, allowedTypes: rule.allowedTypes })
  }
  return parseTypeDescriptionYAML(value)
}

const getStringQualifiers = (parameters: string[], type: string): TypeDescriptionStringQualifiers | undefined => {
  const qualifiers: TypeDescriptionStringQualifiers = { length: 0, allowedLength: "Variable" }
  if (parameters.length > 0) qualifiers.length = parseInt(parameters[0])
  if (type === "ФиксированнаяСтрока") qualifiers.allowedLength = "Fixed"
  return qualifiers.length === 0 && qualifiers.allowedLength === "Variable" ? undefined : qualifiers
}

const getNumberQualifiers = (parameters: string[], type: string): TypeDescriptionNumberQualifiers | undefined => {
  const qualifiers: TypeDescriptionNumberQualifiers = { digits: 0, fractionDigits: 0, allowedSign: "Any" }
  if (parameters.length > 0) qualifiers.digits = parseInt(parameters[0])
  if (parameters.length > 1) qualifiers.fractionDigits = parseInt(parameters[1])
  if (type === "ПоложительноеЧисло") qualifiers.allowedSign = "Nonnegative"
  return qualifiers.digits === 0 && qualifiers.fractionDigits === 0 && qualifiers.allowedSign === "Any"
    ? undefined
    : qualifiers
}

const getDateQualifiers = (type: string): TypeDescriptionDateQualifiers => {
  if (type === "Время") return { dateFractions: "Time" }
  if (type === "ДатаВремя") return { dateFractions: "DateTime" }
  return { dateFractions: "Date" }
}

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "importFromYAML", importTypeDescriptionFromYAML)
export const typeDescriptionIndexRules = defineMetadataRules({
  ...emptyMetadataRules,
  indexValuesFromYAML: { TypeDescription: parseTypeDescriptionYAML },
})
