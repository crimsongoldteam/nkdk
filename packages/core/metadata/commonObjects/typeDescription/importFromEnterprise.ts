import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { formulaFormatParser } from "../../helpers/formulaFormatParser/formulaFormatParser"
import { getTypeFromEnterprise } from "./helper"
import {
  PrimitiveTypeFromEnterprise,
  TypeDescription,
  TypeDescriptionDateQualifiers,
  TypeDescriptionEnterprise,
  TypeDescriptionNumberQualifiers,
  TypeDescriptionStringQualifiers,
} from "./types"

export const importTypeDescriptionFromEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  value: TypeDescriptionEnterprise | undefined
): TypeDescription | undefined => {
  if (value === undefined) {
    return undefined
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
      const primitiveType = PrimitiveTypeFromEnterprise("Строка")
      types.push(primitiveType)
      const stringQualifiers = getStringQualifiers(parameters, type)
      if (stringQualifiers) {
        result.stringQualifiers = stringQualifiers
      }
      continue
    }

    if (type === "Число" || type === "ПоложительноеЧисло") {
      const primitiveType = PrimitiveTypeFromEnterprise("Число")
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
      const primitiveType = PrimitiveTypeFromEnterprise("Булево")
      types.push(primitiveType)
      continue
    }

    const dotIndex = type.indexOf(".")
    const isComplex = dotIndex !== -1
    const baseType = isComplex ? type.substring(0, dotIndex) : type
    const detailType = isComplex ? type.substring(dotIndex + 1) : undefined

    const metadataType = getTypeFromEnterprise(baseType)
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

registerTypeRule("TypeDescription", "importFromEnterprise", importTypeDescriptionFromEnterprise)
