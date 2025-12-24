import { Context } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import {
  MetadataFixedArrayValueXML,
  MetadataFormChoiceListDesTimeValueXML,
  MetadataSimpleValueXML,
  MetadataValue,
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
  const type = removePrefix(xsiType)

  if (type === "string") return { type: "string", value: textValue }
  if (type === "number") return { type: "number", value: Number(textValue) }
  if (type === "dateTime") return { type: "dateTime", value: textValue }
  if (type === "boolean")
    return { type: "boolean", value: importBooleanFromXML(context, textValue as "true" | "false")! }
  if (type === "designTimeRef") return { type: "ref", value: textValue }

  return undefined
}

export const importMetadataValuesFromXML = (
  context: Context,
  data: MetadataValueXML[] | undefined
): MetadataValue[] | undefined => {
  if (!data) return undefined

  return data.map((value) => importMetadataValueFromXML(context, value)!)
}

const removePrefix = (xmlType: string): string => {
  const withoutPrefix = xmlType.replace(/^[^:]+:/, "")
  return withoutPrefix.charAt(0).toLowerCase() + withoutPrefix.slice(1)
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
