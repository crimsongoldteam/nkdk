import type { PropertyRule } from "~/metadata/orchestration/property/types"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
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

type TypeDescriptionYAMLObject = Extract<TypeDescriptionYAML, { ИдентификаторТипа: string[] }>

const isTypeDescriptionYAMLObject = (value: TypeDescriptionYAML): value is TypeDescriptionYAMLObject =>
  typeof value === "object" && value !== null && !Array.isArray(value)

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
  if (externalDataSourceTablePattern.test(type)) {
    return `ExternalDataSourceTableRef.${type}`
  }

  if (externalDataSourceCubeDimensionTablePattern.test(type)) {
    return `ExternalDataSourceCubeDimensionTableRef.${type}`
  }

  return undefined
}

export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    assertTypeDescriptionYAMLAllowed({ value, allowedTypes: rule.allowedTypes })
  }

  if (isTypeDescriptionYAMLObject(value)) {
    const typeId = getTypeIdsFromYAML(value.ИдентификаторТипа)

    if (typeId === undefined || typeId.length === 0) {
      return undefined
    }

    return {
      type: [],
      typeId,
    }
  }

  const types: string[] = []
  const result: TypeDescription = {
    type: types,
  }

  const stringValues = Array.isArray(value) ? value : [value]

  for (const stringValue of stringValues) {
    if (!stringValue || stringValue.trim() === "") {
      continue
    }

    const parsed = formulaFormatParser(stringValue)
    const type = parsed.formula
    const parameters = parsed.parameters

    if (type === "Строка" || type === "ФиксированнаяСтрока") {
      const primitiveType = PrimitiveTypeFromYAML("Строка")
      types.push(primitiveType)
      const stringQualifiers = getStringQualifiers(parameters, type)
      if (stringQualifiers) {
        result.stringQualifiers = stringQualifiers
      }
      continue
    }

    if (type === "Число" || type === "ПоложительноеЧисло") {
      const primitiveType = PrimitiveTypeFromYAML("Число")
      types.push(primitiveType)
      const numberQualifiers = getNumberQualifiers(parameters, type)
      if (numberQualifiers) {
        result.numberQualifiers = numberQualifiers
      }
      continue
    }

    if (type === "Дата" || type === "Время" || type === "ДатаВремя") {
      types.push("dateTime")
      result.dateQualifiers = getDateQualifiers(type)

      continue
    }

    if (type === "Булево") {
      const primitiveType = PrimitiveTypeFromYAML("Булево")
      types.push(primitiveType)
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
      if (isComplex) {
        types.push(`${metadataType}.${detailType}`)
      } else {
        types.push(metadataType)
      }
      continue
    }

    types.push(stringValue)
  }

  if (types.length === 0) {
    return undefined
  }

  return result
}

const getStringQualifiers = (parameters: string[], type: string): TypeDescriptionStringQualifiers | undefined => {
  const stringQualifiers: TypeDescriptionStringQualifiers = { length: 0, allowedLength: "Variable" }
  if (parameters && parameters.length > 0) {
    stringQualifiers.length = parseInt(parameters[0])
  }

  if (type === "ФиксированнаяСтрока") {
    stringQualifiers.allowedLength = "Fixed"
  }

  if (stringQualifiers.length === 0 && stringQualifiers.allowedLength === "Variable") {
    return undefined
  }

  return stringQualifiers
}

const getNumberQualifiers = (parameters: string[], type: string): TypeDescriptionNumberQualifiers | undefined => {
  const numberQualifiers: TypeDescriptionNumberQualifiers = { digits: 0, fractionDigits: 0, allowedSign: "Any" }
  if (parameters && parameters.length > 0) {
    numberQualifiers.digits = parseInt(parameters[0])
  }
  if (parameters && parameters.length > 1) {
    numberQualifiers.fractionDigits = parseInt(parameters[1])
  }
  if (type === "ПоложительноеЧисло") {
    numberQualifiers.allowedSign = "Nonnegative"
  }

  if (
    numberQualifiers.digits === 0 &&
    numberQualifiers.fractionDigits === 0 &&
    numberQualifiers.allowedSign === "Any"
  ) {
    return undefined
  }

  return numberQualifiers
}

const getDateQualifiers = (type: string): TypeDescriptionDateQualifiers | undefined => {
  if (type === "Время") {
    return { dateFractions: "Time" }
  }
  if (type === "ДатаВремя") {
    return { dateFractions: "DateTime" }
  }
  return { dateFractions: "Date" }
}

registerTypeRule("TypeDescription", "importFromYAML", importTypeDescriptionFromYAML)
