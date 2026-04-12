import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { formulaFormatParser } from "../../helpers/formulaFormatParser/formulaFormatParser"
import { defaultGraph } from "../../relations/graph"
import { getTypeDescriptionRule, getTypeFromYAML } from "./helper"
import {
  PrimitiveTypeFromYAML,
  TypeDescription,
  TypeDescriptionDateQualifiers,
  TypeDescriptionNumberQualifiers,
  TypeDescriptionStringQualifiers,
  TypeDescriptionYAML,
} from "./types"

const TYPE_EDGE_NAME = "Тип"

export const importTypeDescriptionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
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

  if (context.graphContext?.parentNodeId) {
    addTypeEdges(context, types)
  }

  return result
}

function addTypeEdges(context: ConfigurationContext, types: string[]): void {
  const { parentNodeId, filePath } = context.graphContext!
  const g = context.graph ?? defaultGraph
  for (const type of types) {
    const dotIndex = type.indexOf(".")
    if (dotIndex === -1) continue
    const baseType = type.substring(0, dotIndex)
    const detailType = type.substring(dotIndex + 1)
    const rule = getTypeDescriptionRule(baseType)
    if (!rule?.modifier || rule.modifier === "alwaysType") continue

    const targetNodeId = `${rule.enterprise}.${detailType}`
    g.ensureNode(targetNodeId, { name: detailType, filePath })
    const edgeKey = `${parentNodeId}:${TYPE_EDGE_NAME}:${targetNodeId}`
    g.ensureEdge(edgeKey, parentNodeId, targetNodeId, { yaml: TYPE_EDGE_NAME, name: TYPE_EDGE_NAME, kind: "reference" })
  }
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
