import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { ConfigurationContext, isTaggedYAMLScalar } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
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

const UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

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

export function parseTypeDescriptionYAML(
  value: unknown,
  _scalarOwner?: object,
  _scalarKey?: string | number,
): TypeDescription | undefined {
  if (value === undefined) return undefined
  if (typeof value === "object" && value !== null && !Array.isArray(value) && !isTaggedYAMLScalar(value)) {
    throw new Error("Тип: объектная форма ИдентификаторТипа не поддерживается")
  }

  const yamlItems = typeDescriptionYAMLItems(value)

  const types: string[] = []
  const result: TypeDescription = { type: types }
  const typeIds: string[] = []

  for (const { value: rawValue } of yamlItems) {
    const scalar = isTaggedYAMLScalar(rawValue) ? rawValue.value : rawValue
    if (typeof scalar !== "string" || scalar.trim() === "") continue
    if (UUID_PATTERN.test(scalar)) {
      typeIds.push(scalar)
      continue
    }
    const stringValue = scalar
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

  if (typeIds.length > 0) result.typeId = typeIds
  return types.length === 0 && typeIds.length === 0 ? undefined : result
}

function typeDescriptionYAMLItems(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => ({ value: item }))
  }
  return [{ value }]
}

export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
  return importTypeDescriptionYAMLValue(rule, value)
}

function importTypeDescriptionYAMLValue(
  rule: PropertyRule | undefined,
  value: unknown,
  _scalarOwner?: object,
  _scalarKey?: string | number,
): TypeDescription | undefined {
  if (value === undefined) return undefined
  const parsed = parseTypeDescriptionYAML(value)
  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    const semanticValue = semanticTypeDescriptionYAML(value)
    if (semanticValue !== undefined) {
      assertTypeDescriptionYAMLAllowed({ value: semanticValue, allowedTypes: rule.allowedTypes })
    }
  }
  return parsed
}

function semanticTypeDescriptionYAML(
  value: unknown,
): TypeDescriptionYAML | undefined {
  const values = typeDescriptionYAMLItems(value)
    .map(({ value: item }) => item)
  if (values.length === 0) return undefined
  return (values.length === 1 ? values[0] : values) as TypeDescriptionYAML
}

export const importTaggedTypeDescriptionFromYAML: ImportFromYAMLFunctionNew = (params) => {
  const propertyName = params.rule.yaml ?? "Тип"
  if (params.value === undefined) return undefined
  return importTypeDescriptionYAMLValue(params.rule, params.value, params.yaml, propertyName)
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

export const metadataPropertyRule000 = definePropertyTypeRule("TypeDescription", "importFromYAML", importTaggedTypeDescriptionFromYAML)
export const typeDescriptionIndexRules = defineMetadataRules({
  ...emptyMetadataRules,
  indexValuesFromYAML: { TypeDescription: parseTypeDescriptionYAML },
})
