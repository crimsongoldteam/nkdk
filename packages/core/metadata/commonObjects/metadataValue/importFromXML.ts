import { Context } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
  MetadataSimpleValue,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
  MetadataValueXML,
} from "./types"

export const importMetadataValueFromXML = (
  context: Context,
  data: MetadataValueXML | undefined,
  type?: MetadataValueType
): MetadataValue | undefined => {
  if (!data) return undefined

  const resultedType = type ?? extractType(data["_xsi:type"])

  if (!resultedType) throw new Error(`Invalid type: ${data["_xsi:type"]}`)

  if (resultedType === "fixedArray") {
    return importFixedArrayFromXML(context, data as MetadataFixedArrayValueXML)
  }

  if (resultedType === "formChoiceListDesTimeValue") {
    return importFormChoiceListDesTimeValueFromXML(context, data as MetadataFormChoiceListDesTimeValueXML)
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

  return {
    type: resultedType as MetadataSimpleValue["type"],
    value: importSimpleValueFromXML(context, textValue, resultedType)!,
  } as MetadataSimpleValue
}

export const importMetadataValueFromXMLAsPrimitive = (
  context: Context,
  data: MetadataValueXML | undefined,
  type: MetadataValueType
): string | boolean | number | undefined => {
  return importMetadataValueFromXML(context, data, type)?.value as string | boolean | number | undefined
}

const importSimpleValueFromXML = (
  context: Context,
  textValue: string | boolean | number | undefined,
  type: MetadataValueType
): string | boolean | number | undefined => {
  if (type === "string") return importMetadataStringValueFromXML(context, textValue as string | undefined)
  if (type === "decimal") return importMetadataDecimalValueFromXML(context, textValue as string | undefined)
  if (type === "dateTime") return importMetadataDateTimeValueFromXML(context, textValue as string | undefined)
  if (type === "boolean") return importMetadataBooleanValueFromXML(context, textValue as string | boolean | undefined)
  if (type === "ref") return importMetadataRefValueFromXML(context, textValue as string | undefined)
  if (type === "objectRef") return importMetadataObjectRefValueFromXML(context, textValue as string | undefined)
}

export const importMetadataValuesFromXML = (
  context: Context,
  data: MetadataValueXML[] | undefined
): MetadataValue[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML(context, value)!)
}

export const importMetadataSimpleValueFromXML = (
  context: Context,
  data: MetadataSimpleValueXML | undefined
): string | boolean | number | undefined => {
  const result = importMetadataValueFromXML(context, data)
  if (!result) return undefined

  if (!isPrimitiveType(result.type)) throw new Error(`Invalid type: ${result.type}`)
  return result.value as string | boolean | number
}

export const importMetadataStringValueFromXML = (_context: Context, value: string | undefined): string | undefined => {
  return String(value)
}

export const importMetadataDecimalValueFromXML = (_context: Context, value: string | undefined): number | undefined => {
  return value !== undefined ? Number(value) : undefined
}

export const importMetadataDateTimeValueFromXML = (
  _context: Context,
  value: string | undefined
): string | undefined => {
  return value
}

export const importMetadataBooleanValueFromXML = (
  context: Context,
  value: string | boolean | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  if (typeof value === "boolean") return value
  return importBooleanFromXML(context, value as "true" | "false")!
}

export const importMetadataRefValueFromXML = (_context: Context, value: string | undefined): string | undefined => {
  return value
}

export const importMetadataObjectRefValueFromXML = (
  _context: Context,
  value: string | undefined
): string | undefined => {
  return value
}

const extractType = (xmlType: MetadataValueTypeXML): MetadataValueType | undefined => {
  return MetadataValueTypeFromXML(xmlType)
}

const importFixedArrayFromXML = (
  context: Context,
  data: MetadataFixedArrayValueXML | { "v8:Value": string | string[] }
): MetadataValue => {
  const values = Array.isArray(data["v8:Value"]) ? data["v8:Value"] : [data["v8:Value"]]
  return {
    type: "fixedArray",
    value: values.map((v) => importMetadataValueFromXML(context, v as MetadataValueXML)!),
  }
}

const importFormChoiceListDesTimeValueFromXML = (
  context: Context,
  data: MetadataFormChoiceListDesTimeValueXML
): MetadataValue | undefined => {
  const value = importMetadataValueFromXML(context, data.Value)
  if (!value) return undefined
  return { type: "formChoiceListDesTimeValue", value }
}

const isPrimitiveType = (type: MetadataValueType): boolean => {
  return type === "string" || type === "decimal" || type === "dateTime" || type === "boolean"
}
