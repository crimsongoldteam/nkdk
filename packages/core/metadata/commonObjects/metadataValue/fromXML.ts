import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importFromXMLFunction } from "~/metadata/orchestration/property/fn"
import { ConfigurationContext, ConfigurationContextFromXML } from "../../context/types"
import { importBooleanFromXML } from "../boolean/fromXML"
import { importI8nTextFromXML } from "../i8nText/fromXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataTypedPrimitiveValue,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
} from "./types"

export const importMetadataValueFromXML = (params: {
  context: ConfigurationContextFromXML
  rule: PropertyRule | undefined
  value: any
  type?: MetadataValueType
}): any => {
  const { context, value: data, type, rule } = params
  if (!data) return undefined

  const resultedType = type ?? extractType(data["_xsi:type"])

  if (!resultedType) throw new Error(`Invalid type: ${data["_xsi:type"]}`)

  if (resultedType === "fixedArray") {
    return importFixedArrayFromXML(context, undefined, data as MetadataFixedArrayValueXML)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return importFormChoiceListValueFromXML(context, undefined, data as MetadataFormChoiceListValueXML)
  }

  const textValue = (data as any)["#text"] as string | boolean | number | undefined

  const simpleValueTypes: MetadataTypedPrimitiveValue["type"][] = [
    "string",
    "decimal",
    "dateTime",
    "boolean",
    "ref",
    "objectRef",
  ]
  if (!simpleValueTypes.includes(resultedType as MetadataTypedPrimitiveValue["type"])) {
    throw new Error(`Invalid simple value type: ${resultedType}`)
  }

  const importedValue = importSimpleValueFromXML(context, undefined, textValue, resultedType)
  if (importedValue === undefined) {
    return undefined
  }

  const withType = Boolean((rule as any)?.withType) || type !== undefined

  // Без `withType` стараемся возвращать примитив там, где это ожидается в YAML/XML пайплайне.
  if (!withType && rule && resultedType === "string") {
    const s = String(importedValue)
    if ((rule as any)?.valueType === "string") {
      // "numberAsString" кейс: в ряде мест строковый xsi:type используется для чисел
      if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s)
    }
    // обычная строка
    if ((rule as any)?.valueType === undefined) return s
  }

  return {
    type: resultedType as MetadataTypedPrimitiveValue["type"],
    value: importedValue,
  } as MetadataTypedPrimitiveValue
}

const importSimpleValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  textValue: string | boolean | number | undefined,
  type: MetadataValueType
): string | boolean | number | undefined => {
  if (type === "string")
    return importMetadataStringValueFromXML(
      context,
      undefined,
      textValue === undefined ? undefined : String(textValue)
    )
  if (type === "decimal") return importMetadataDecimalValueFromXML(context, undefined, textValue as string | undefined)
  if (type === "dateTime")
    return importMetadataDateTimeValueFromXML(context, undefined, textValue as string | undefined)
  if (type === "boolean")
    return importMetadataBooleanValueFromXML(context, undefined, textValue as string | boolean | undefined)
  if (type === "ref") return importMetadataRefValueFromXML(context, undefined, textValue as string | undefined)
  if (type === "objectRef")
    return importMetadataObjectRefValueFromXML(context, undefined, textValue as string | undefined)
}

export const importMetadataValuesFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any[] | undefined
): any[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML({ context, rule: undefined, value })!)
}

export const importMetadataSimpleValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: any
): string | boolean | number | undefined => {
  const result = importMetadataValueFromXML({ context, rule: undefined, value: data })
  if (!result) return undefined

  if (!isPrimitiveType(result.type)) throw new Error(`Invalid type: ${result.type}`)
  return result.value as string | boolean | number
}

export const importMetadataStringValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  if (value === undefined || value === "") {
    return undefined
  }
  return value
}

export const importMetadataDecimalValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): number | undefined => {
  return value !== undefined ? Number(value) : undefined
}

export const importMetadataDateTimeValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

export const importMetadataBooleanValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  value: string | boolean | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return importBooleanFromXML(context, undefined, value as "true" | "false")!
}

export const importMetadataRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

export const importMetadataObjectRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

const extractType = (xmlType: MetadataValueTypeXML): MetadataValueType | undefined => {
  return MetadataValueTypeFromXML(xmlType)
}

const importFixedArrayFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValueXML | { "v8:Value": string | string[] }
): any => {
  const values = Array.isArray(data["v8:Value"]) ? data["v8:Value"] : [data["v8:Value"]]
  return {
    type: "fixedArray",
    value: values.map((v) => importMetadataValueFromXML({ context, rule: undefined, value: v as any })!),
  }
}

export const importFormChoiceListValueFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  const value = importMetadataValueFromXML({ context, rule: undefined, value: data.Value })
  const presentation = importI8nTextFromXML(context, { type: "I8nText" }, data.Presentation)
  return { type: "formChoiceListDesTimeValue", value, presentation }
}

const isPrimitiveType = (type: MetadataValueType): boolean => {
  return type === "string" || type === "decimal" || type === "dateTime" || type === "boolean"
}

export const importAssociatedTableFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule,
  data: any
): string | undefined => {
  const result = importMetadataValueFromXML({ context, rule, value: data, type: "string" })
  return result?.value as string | undefined
}

const importMetadataValueFromXMLForRule: importFromXMLFunction = (context, rule, value) =>
  importMetadataValueFromXML({ context, rule, value })

registerTypeRule("MetadataValue", "importFromXML", importMetadataValueFromXMLForRule)

registerTypeRule("AssociatedTable", "importFromXML", importAssociatedTableFromXML)
