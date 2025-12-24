import { Context } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
  MetadataSimpleValueXML,
  MetadataValue,
  MetadataValueType,
  MetadataValueTypeFromXML,
  MetadataValueTypeXML,
  MetadataValueXML,
} from "./types"

export const importMetadataValueFromXML = (
  context: Context,
  data: MetadataValueXML | undefined
): MetadataValue | undefined => {
  if (!data) return undefined

  const xsiType = data["_xsi:type"]

  if (xsiType === "v8:FixedArray") {
    return importFixedArrayFromXML(context, data as MetadataFixedArrayValueXML)
  }

  if (xsiType === "FormChoiceListDesTimeValue") {
    return importFormChoiceListDesTimeValueFromXML(context, data as MetadataFormChoiceListDesTimeValueXML)
  }

  if (!xsiType) return undefined

  const textValue = (data as MetadataSimpleValueXML)["#text"]
  const type = extractType(xsiType)

  if (type === "string") return { type: "string", value: textValue as string }
  if (type === "decimal") return { type: "decimal", value: Number(textValue) }
  if (type === "dateTime") return { type: "dateTime", value: textValue as string }
  if (type === "boolean")
    return { type: "boolean", value: importBooleanFromXML(context, textValue as "true" | "false")! }
  if (type === "ref") return { type: "ref", value: textValue as string }
  if (type === "objectRef") return { type: "objectRef", value: textValue as string }
  if (xsiType === "app:ApplicationUsePurpose") return { type: "ApplicationUsePurpose", value: textValue as string }

  return undefined
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
