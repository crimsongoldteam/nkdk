import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { _importBooleanFromXML } from "../boolean/_importFromXML"
import { _importI8nTextFromXML } from "../i8nText/_importFromXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListValue,
  MetadataFormChoiceListValueXML,
  MetadataSimpleValue,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
  MetadataValueXML,
} from "./types"

export const importMetadataValueFromXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  data: MetadataValueXML | undefined,
  type?: MetadataValueType
): MetadataValue | undefined => {
  if (!data) return undefined

  const resultedType = type ?? extractType(data["_xsi:type"])

  if (!resultedType) throw new Error(`Invalid type: ${data["_xsi:type"]}`)

  if (resultedType === "fixedArray") {
    return _importFixedArrayFromXML(context, rule, data as MetadataFixedArrayValueXML)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return _importFormChoiceListValueFromXML(context, rule, data as MetadataFormChoiceListValueXML)
  }

  const textValue = (data as MetadataSimpleValueXML)["#text"] as string | boolean | number | undefined

  const simpleValueTypes: MetadataSimpleValue["type"][] = [
    "string",
    "decimal",
    "dateTime",
    "boolean",
    "ref",
    "objectRef",
  ]
  if (!simpleValueTypes.includes(resultedType as MetadataSimpleValue["type"])) {
    throw new Error(`Invalid simple value type: ${resultedType}`)
  }

  const importedValue = _importSimpleValueFromXML(context, rule, textValue, resultedType)
  if (importedValue === undefined) {
    return undefined
  }

  return {
    type: resultedType as MetadataSimpleValue["type"],
    value: importedValue,
  } as MetadataSimpleValue
}

const _importSimpleValueFromXML = (
  context: ConfigurationContext,
  rule: PropertyRule | undefined,
  textValue: string | boolean | number | undefined,
  type: MetadataValueType
): string | boolean | number | undefined => {
  if (type === "string") return _importMetadataStringValueFromXML(context, rule, textValue as string | undefined)
  if (type === "decimal") return _importMetadataDecimalValueFromXML(context, rule, textValue as string | undefined)
  if (type === "dateTime") return _importMetadataDateTimeValueFromXML(context, rule, textValue as string | undefined)
  if (type === "boolean")
    return _importMetadataBooleanValueFromXML(context, rule, textValue as string | boolean | undefined)
  if (type === "ref") return _importMetadataRefValueFromXML(context, rule, textValue as string | undefined)
  if (type === "objectRef") return _importMetadataObjectRefValueFromXML(context, rule, textValue as string | undefined)
}

export const _importMetadataStringValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  if (value === undefined || value === "") {
    return undefined
  }
  return value
}

export const _importMetadataDecimalValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): number | undefined => {
  return value !== undefined ? Number(value) : undefined
}

export const _importMetadataDateTimeValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

export const _importMetadataBooleanValueFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | boolean | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return _importBooleanFromXML(context, _rule, value as "true" | "false")!
}

export const _importMetadataRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

export const _importMetadataObjectRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  value: string | undefined
): string | undefined => {
  return value
}

const extractType = (xmlType: MetadataValueTypeXML): MetadataValueType | undefined => {
  return MetadataValueTypeFromXML(xmlType)
}

const _importFixedArrayFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFixedArrayValueXML | { "v8:Value": string | string[] }
): MetadataValue => {
  const values = Array.isArray(data["v8:Value"]) ? data["v8:Value"] : [data["v8:Value"]]
  return {
    type: "fixedArray",
    value: values.map((v) => importMetadataValueFromXML(context, _rule, v as MetadataValueXML)!),
  }
}

export const _importFormChoiceListValueFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  const value = importMetadataValueFromXML(context, _rule, data.Value)
  const presentation = _importI8nTextFromXML(context, _rule, data.Presentation)
  return { type: "formChoiceListDesTimeValue", value, presentation }
}
