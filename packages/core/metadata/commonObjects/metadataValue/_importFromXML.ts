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

export const _importMetadataValueFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataValueXML | undefined,
  type?: MetadataValueType
): MetadataValue | undefined => {
  if (!data) return undefined

  const resultedType = type ?? extractType(data["_xsi:type"])

  if (!resultedType) throw new Error(`Invalid type: ${data["_xsi:type"]}`)

  if (resultedType === "fixedArray") {
    return _importFixedArrayFromXML(context, _rule, data as MetadataFixedArrayValueXML)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return _importFormChoiceListValueFromXML(context, _rule, data as MetadataFormChoiceListValueXML)
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

  const importedValue = _importSimpleValueFromXML(context, _rule, textValue, resultedType)
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
  _rule: PropertyRule,
  textValue: string | boolean | number | undefined,
  type: MetadataValueType
): string | boolean | number | undefined => {
  if (type === "string") return _importMetadataStringValueFromXML(context, _rule, textValue as string | undefined)
  if (type === "decimal") return _importMetadataDecimalValueFromXML(context, _rule, textValue as string | undefined)
  if (type === "dateTime") return _importMetadataDateTimeValueFromXML(context, _rule, textValue as string | undefined)
  if (type === "boolean") return _importMetadataBooleanValueFromXML(context, _rule, textValue as string | boolean | undefined)
  if (type === "ref") return _importMetadataRefValueFromXML(context, _rule, textValue as string | undefined)
  if (type === "objectRef") return _importMetadataObjectRefValueFromXML(context, _rule, textValue as string | undefined)
}

export const _importMetadataStringValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => {
  if (value === undefined || value === "") {
    return undefined
  }
  return value
}

export const _importMetadataDecimalValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): number | undefined => {
  return value !== undefined ? Number(value) : undefined
}

export const _importMetadataDateTimeValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => {
  return value
}

export const _importMetadataBooleanValueFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | boolean | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return _importBooleanFromXML(context, _rule, value as "true" | "false")!
}

export const _importMetadataRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => {
  return value
}

export const _importMetadataObjectRefValueFromXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule,
  value: string | undefined
): string | undefined => {
  return value
}

const extractType = (xmlType: MetadataValueTypeXML): MetadataValueType | undefined => {
  return MetadataValueTypeFromXML(xmlType)
}

const _importFixedArrayFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataFixedArrayValueXML | { "v8:Value": string | string[] }
): MetadataValue => {
  const values = Array.isArray(data["v8:Value"]) ? data["v8:Value"] : [data["v8:Value"]]
  return {
    type: "fixedArray",
    value: values.map((v) => _importMetadataValueFromXML(context, _rule, v as MetadataValueXML)!),
  }
}

export const _importFormChoiceListValueFromXML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  data: MetadataFormChoiceListValueXML
): MetadataFormChoiceListValue | undefined => {
  const value = _importMetadataValueFromXML(context, _rule, data.Value)
  const presentation = _importI8nTextFromXML(context, _rule, data.Presentation)
  return { type: "formChoiceListDesTimeValue", value, presentation }
}
