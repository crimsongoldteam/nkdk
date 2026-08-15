import { definePropertyTypeRule } from "../../ruleRuntime/property/propertyRuleRegistrySet"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"
import { ConfigurationContext, isTaggedYAMLScalar, xmlAnomalyTagPayload, yamlScalarTagAt } from "@nkdk/runtime"
import type { ImportFromYAMLFunctionNew } from "@nkdk/runtime/rule-kit"
import { formulaFormatParser } from "../../helpers/formulaFormatParser/formulaFormatParser"
import { assertTypeDescriptionYAMLAllowed, METADATA_NAME_YAML_PATTERN } from "./allowedTypes"
import { getSystemEnumerationTypeFromYAML, getTypeDescriptionRule, getTypeFromYAML } from "./helper"
import {
  PrimitiveTypeFromYAML,
  TypeDescription,
  TYPE_DESCRIPTION_SOURCE_TYPES,
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

  const sourceValues = Array.isArray(value) ? value : [value]
  const stringValues = sourceValues.flatMap((item, index) =>
    typeof item === "string" && item.trim() !== ""
      ? [{ value: item, tagged: Array.isArray(value) && yamlScalarTagAt(value, index) === "xml/type" }]
      : []
  )
  if (stringValues.length === 0) return undefined

  const types: string[] = []
  const result: TypeDescription = { type: types }
  const sourceTypes: NonNullable<TypeDescription[typeof TYPE_DESCRIPTION_SOURCE_TYPES]> = {}

  for (const { value: stringValue, tagged } of stringValues) {
    if (tagged) {
      const parsed = parseTaggedTypeDescription("Тип", stringValue)
      types.push(...parsed.type)
      Object.assign(sourceTypes, parsed[TYPE_DESCRIPTION_SOURCE_TYPES])
      continue
    }
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

  if (Object.keys(sourceTypes).length > 0) {
    Object.defineProperty(result, TYPE_DESCRIPTION_SOURCE_TYPES, {
      value: sourceTypes,
      enumerable: false,
    })
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
    assertTypeDescriptionYAMLAllowed({
      value: semanticTypeDescriptionYAML(value),
      allowedTypes: rule.allowedTypes,
    })
  }
  return parseTypeDescriptionYAML(value)
}

function semanticTypeDescriptionYAML(value: TypeDescriptionYAML): TypeDescriptionYAML {
  if (!Array.isArray(value)) return value
  return value.map((item, index) =>
    yamlScalarTagAt(value, index) === "xml/type" ? semanticTaggedType(item) : item
  ) as TypeDescriptionYAML
}

function semanticTaggedType(value: unknown): unknown {
  const scalar = isTaggedYAMLScalar(value) && value.tag === "xml/type" ? value.value : value
  if (typeof scalar !== "string") return value
  const payload = xmlAnomalyTagPayload("xml/type", scalar)
  const separator = payload.indexOf(":")
  return separator <= 0 ? value : payload.slice(separator + 1)
}

const generatedPrefixPattern = /^d(\d+)p1$/
const currentConfigNamespace = "http://v8.1c.ru/8.1/data/enterprise/current-config"

const isCompatibleGeneratedPrefix = (prefix: string, type: string): boolean => {
  const match = generatedPrefixPattern.exec(prefix)
  if (match === null) return false
  const dot = type.indexOf(".")
  const rule = getTypeDescriptionRule(dot === -1 ? type : type.slice(0, dot))
  if (rule === undefined) return false
  const number = Number(match[1])
  if (rule.prefix === "cfg") return number % 2 === 0
  return rule.namespace !== undefined && number % 2 === 1
}

const parseTaggedTypeDescription = (propertyName: string, value: unknown): TypeDescription => {
  const error = `${propertyName}: недопустимое значение !xml/type для типа`
  const scalar = isTaggedYAMLScalar(value) && value.tag === "xml/type" ? value.value : value
  if (typeof scalar !== "string") throw new Error(error)
  const payload = xmlAnomalyTagPayload("xml/type", scalar)
  const separator = payload.indexOf(":")
  if (separator <= 0 || separator === payload.length - 1) throw new Error(error)
  const prefix = payload.slice(0, separator)
  const yamlType = payload.slice(separator + 1)
  const parsed = parseTypeDescriptionYAML(yamlType)
  if (
    parsed === undefined ||
    parsed.type.length !== 1 ||
    parsed.typeId !== undefined ||
    parsed.stringQualifiers !== undefined ||
    parsed.numberQualifiers !== undefined ||
    parsed.dateQualifiers !== undefined
  ) throw new Error(error)
  const type = parsed.type[0]!
  const dot = type.indexOf(".")
  const rule = getTypeDescriptionRule(dot === -1 ? type : type.slice(0, dot))
  const expectedYamlType = rule === undefined
    ? undefined
    : dot === -1
      ? rule.enterprise
      : `${rule.enterprise}.${type.slice(dot + 1)}`
  if (yamlType !== expectedYamlType) throw new Error(error)
  const namespace = rule?.prefix === "cfg" ? currentConfigNamespace : rule?.namespace
  if (namespace === undefined || !isCompatibleGeneratedPrefix(prefix, type)) throw new Error(error)

  Object.defineProperty(parsed, TYPE_DESCRIPTION_SOURCE_TYPES, {
    value: { [type]: { value: `${prefix}:${type}`, namespace } },
    enumerable: false,
  })
  return parsed
}

export const importTaggedTypeDescriptionFromYAML: ImportFromYAMLFunctionNew = (params) => {
  const propertyName = params.rule.yaml ?? "Тип"
  if (params.value === undefined) return undefined
  if (yamlScalarTagAt(params.yaml, propertyName) === "xml/type") {
    const parsed = parseTaggedTypeDescription(propertyName, params.value)
    if (params.rule.allowedTypes !== undefined) {
      const scalar = isTaggedYAMLScalar(params.value) ? params.value.value : params.value
      if (typeof scalar !== "string") throw new Error(`${propertyName}: недопустимое значение !xml/type для типа`)
      const payload = xmlAnomalyTagPayload("xml/type", scalar)
      assertTypeDescriptionYAMLAllowed({ value: payload.slice(payload.indexOf(":") + 1), allowedTypes: params.rule.allowedTypes })
    }
    return parsed
  }
  return importTypeDescriptionFromYAML(params.context, params.rule, params.value)
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
